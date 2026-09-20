import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { replayLlm, runAgentInTest } from '../../../kernel/src/testing/index';
import { SvjService } from '../../svj/index';
import { invoiceProcessor } from '../agents/invoice-processor/agent';
import { getInvoice } from '../service/index';
import { BLOCKED_INVOICE, REPLAY_FIXTURE, invoiceFrom, loadEveryTool } from './agent.fixture';
import { seedCleaningSupplier, seedTidySvj, useRecordedLlm } from './extraction.fixture';
import { startInvoicesWorld, withTestTenant, type InvoicesWorld } from './world.fixture';

const reviewNoteSchema = z.object({
  reviewNote: z.object({ note: z.string(), missing: z.array(z.string()).readonly() }),
});

let world: InvoicesWorld;
let ctx: RequestContext;
let svjId: SvjId;

beforeAll(async () => {
  world = await startInvoicesWorld();
  useRecordedLlm();
  ctx = (await withTestTenant()).ctx;
  await loadEveryTool();

  const svj = new SvjService();
  const created = await svj.createSvj(ctx, {
    name: 'SVJ Krátká 1',
    ico: '40000002',
    address: { street: 'Krátká 1', city: 'Praha 1', postalCode: '110 00' },
  });
  svjId = created.id;

  await seedTidySvj(ctx, svjId, await seedCleaningSupplier(ctx));
  await invoiceFrom(ctx, svjId, 'unknown-supplier', BLOCKED_INVOICE);
}, 300_000);

afterAll(async () => {
  await world.stop();
});

describe('invoice-processor on an invoice the checks stopped', () => {
  it('writes down what is missing and leaves the invoice where it is', async () => {
    const result = await runAgentInTest(
      { ...ctx, svjScope: [svjId] },
      invoiceProcessor,
      {
        kind: 'event',
        name: 'finance.invoice.needs_review',
        payload: { invoiceId: BLOCKED_INVOICE, svjId, reasons: ['supplier_unknown'] },
      },
      { llm: replayLlm(REPLAY_FIXTURE), maxTurns: 6 },
    );

    expect(result.status).toBe('succeeded');

    const invoice = await getInvoice(ctx, BLOCKED_INVOICE);
    const note = reviewNoteSchema.parse(invoice.checks);

    expect(invoice).toMatchObject({ status: 'needs_review', approvalId: null });
    expect(note.reviewNote.missing.length).toBeGreaterThan(0);
    expect(note.reviewNote.note).toContain('adresáři');
  }, 180_000);
});
