import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { approvals } from '../../../kernel/src/approvals/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { replayLlm, runAgentInTest } from '../../../kernel/src/testing/index';
import { getInvoice, invoiceApproved, type InvoiceId } from '../../invoices/index';
import { accountingSyncGuard } from '../agents/accounting-sync-guard/agent';
import { pohodaMock } from '../adapters/index';
import { accountingGetConflict } from '../tools/get-conflict';
import { accountingProposeResolution, proposeResolutionSchema } from '../tools/propose-resolution';
import { detectConflicts, listConflicts } from '../service/index';
import { postApprovedInvoice } from '../subscribers/post-invoice';
import { startComposedDb, withTestTenant, type TestDatabase } from './accounting.fixture';
import { loadEveryTool, replayFixtureFor } from './agent.fixture';
import { approvedInvoice, deliver, linkedHouse, type LinkedHouse } from './flow.fixture';

let database: TestDatabase;
let ctx: RequestContext;
let house: LinkedHouse;
let conflictId: string;
let invoiceId: InvoiceId;
let fixture: string;

beforeAll(async () => {
  database = await startComposedDb();
  ctx = (await withTestTenant()).ctx;
  await loadEveryTool();
  house = await linkedHouse(ctx);

  const invoice = await approvedInvoice(ctx, house, '8001');
  invoiceId = invoice.id;
  await deliver(ctx, postApprovedInvoice.handler, {
    name: invoiceApproved.name,
    version: invoiceApproved.version,
    payload: {
      invoiceId,
      svjId: house.svjId,
      supplierId: house.svjId,
      amountTotal: invoice.amountTotal,
      dueOn: invoice.dueOn,
      variableSymbol: invoice.variableSymbol,
      budgetCategory: null,
    },
  });

  const ref = (await getInvoice(ctx, invoiceId)).accountingRef ?? '';
  await pohodaMock.mutateInvoice(ctx, house.svjId, ref, { amountTotal: 10_900 });
  conflictId = (await detectConflicts(ctx, house.svjId))[0] ?? '';

  fixture = await replayFixtureFor({ CONFLICT_ID: conflictId, INVOICE_ID: invoiceId });
}, 600_000);

afterAll(async () => {
  await database.stop();
});

describe('accounting-sync-guard over a batch of differences', () => {
  it('is composed of one tool that reads and one that only proposes', () => {
    expect(accountingGetConflict.readOnly).toBe(true);
    expect(accountingProposeResolution.proposal).toBe(true);
    expect(accountingSyncGuard.tools).toContain(accountingProposeResolution.name);
    expect(accountingSyncGuard.autonomy).toBe('propose');
  });

  it('reads the difference and leaves a proposal behind it', async () => {
    const result = await runAgentInTest(
      { ...ctx, svjScope: [house.svjId] },
      accountingSyncGuard,
      {
        kind: 'event',
        name: 'finance.sync.conflict',
        payload: { svjId: house.svjId, conflictIds: [conflictId] },
      },
      { llm: replayLlm(fixture), maxTurns: 10 },
    );

    expect(result.status).toBe('succeeded');
  }, 300_000);

  it('changes nothing by itself: the conflict is still open and waits for finance', async () => {
    const pending = await approvals.list(ctx, { status: 'pending' });
    const proposals = pending.filter((one) => one.toolName === accountingProposeResolution.name);
    expect(proposals).toHaveLength(1);

    const detail = await approvals.get(ctx, proposals[0]?.id ?? ('' as never));
    const proposed = proposeResolutionSchema.parse(detail.input);
    expect(proposed).toMatchObject({ conflictId, resolution: 'take_theirs' });
    expect(proposed.note.length).toBeGreaterThan(20);

    await expect(listConflicts(ctx, house.svjId, 'open')).resolves.toHaveLength(1);
  });
});
