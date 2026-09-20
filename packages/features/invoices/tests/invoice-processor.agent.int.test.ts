import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { approvals, type ApprovalDetail } from '../../../kernel/src/approvals/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { createUser } from '../../../kernel/src/identity/index';
import type { SvjId, UserId } from '../../../kernel/src/ids/index';
import { replayLlm, runAgentInTest } from '../../../kernel/src/testing/index';
import { SvjService } from '../../svj/index';
import { invoiceProcessor } from '../agents/invoice-processor/agent';
import type { InvoiceId } from '../domain/ids';
import { approveInput } from '../tools/approve';
import { getInvoice } from '../service/index';
import {
  CLEAN_INVOICE,
  DEVIATING_INVOICE,
  REPLAY_FIXTURE,
  invoiceFrom,
  loadEveryTool,
} from './agent.fixture';
import { seedCleaningSupplier, seedTidySvj, useRecordedLlm } from './extraction.fixture';
import { startInvoicesWorld, withTestTenant, type InvoicesWorld } from './world.fixture';

let world: InvoicesWorld;
let ctx: RequestContext;
let svjId: SvjId;
let chairId: UserId;

const run = (name: string, payload: Record<string, unknown>) =>
  runAgentInTest(
    { ...ctx, svjScope: [svjId] },
    invoiceProcessor,
    { kind: 'event', name, payload },
    { llm: replayLlm(REPLAY_FIXTURE), maxTurns: 6 },
  );

beforeAll(async () => {
  world = await startInvoicesWorld();
  useRecordedLlm();
  ctx = (await withTestTenant()).ctx;
  await loadEveryTool();

  const svj = new SvjService();
  const created = await svj.createSvj(ctx, {
    name: 'SVJ Krátká 1',
    ico: '40000001',
    address: { street: 'Krátká 1', city: 'Praha 1', postalCode: '110 00' },
  });
  svjId = created.id;
  chairId = await createUser(ctx, {
    email: 'vybor-agent@example.test',
    displayName: 'Člen výboru',
    password: 'test-password',
    roles: ['committee'],
    svjId,
  });
  await svj.updateSvj(ctx, svjId, { committee: [chairId] });

  await seedTidySvj(ctx, svjId, await seedCleaningSupplier(ctx));
  await invoiceFrom(ctx, svjId, 'as-agreed', CLEAN_INVOICE);
  await invoiceFrom(ctx, svjId, 'above-contract', DEVIATING_INVOICE);
}, 300_000);

afterAll(async () => {
  await world.stop();
});

const approvalOn = async (invoiceId: InvoiceId): Promise<ApprovalDetail | null> => {
  const invoice = await getInvoice(ctx, invoiceId);
  return invoice.approvalId === null ? null : approvals.get(ctx, invoice.approvalId);
};

const proposalOf = (approval: ApprovalDetail | null): z.output<typeof approveInput> =>
  approveInput.parse(approval?.input);

describe('invoice-processor on an invoice that checked out', () => {
  it('proposes it to the committee and parks it there', async () => {
    const result = await run('finance.invoice.extracted', {
      invoiceId: CLEAN_INVOICE,
      svjId,
      warnings: [],
    });

    expect(result.status).toBe('succeeded');
    await expect(getInvoice(ctx, CLEAN_INVOICE)).resolves.toMatchObject({
      status: 'pending_approval',
    });
    const approval = await approvalOn(CLEAN_INVOICE);
    expect(approval).toMatchObject({
      toolName: 'invoice.approve',
      status: 'pending',
      approvers: [chairId],
    });
    expect(proposalOf(approval)).toMatchObject({ recommendation: 'approve', risks: [] });
  }, 180_000);
});

describe('invoice-processor on an invoice with a warning', () => {
  it('still proposes it, but asks the committee to look and says why', async () => {
    await run('finance.invoice.extracted', {
      invoiceId: DEVIATING_INVOICE,
      svjId,
      warnings: ['amount_deviates'],
    });

    const proposal = proposalOf(await approvalOn(DEVIATING_INVOICE));

    expect(proposal.recommendation).toBe('review');
    expect(proposal.risks.length).toBeGreaterThan(0);
  }, 180_000);
});
