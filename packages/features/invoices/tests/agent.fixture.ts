import { join } from 'node:path';
import type { RequestContext } from '../../../kernel/src/context/index';
import { loadToolsFrom } from '../../../kernel/src/tools/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { storeDocument } from '../../documents/index';
import { invoiceIdSchema, type InvoiceId } from '../domain/ids';
import { createInvoice, processReceivedInvoice } from '../service/index';
import { scenarioNamed } from './fixtures/invoice-scenarios.fixture';
import { scenarioPdf } from './fixtures/scenario-pdf.fixture';

export const REPLAY_FIXTURE = new URL('./fixtures/agent/invoice-processor.replay.json', import.meta.url)
  .pathname;

/** The ids the replay fixture names. The invoice is minted rather than generated for that reason. */
export const CLEAN_INVOICE = invoiceIdSchema.parse('11111111-1111-7111-8111-111111111111');
export const DEVIATING_INVOICE = invoiceIdSchema.parse('22222222-2222-7222-8222-222222222222');
export const BLOCKED_INVOICE = invoiceIdSchema.parse('33333333-3333-7333-8333-333333333333');

const REPO_ROOT = new URL('../../../../', import.meta.url).pathname;

/**
 * Every feature's tools, found the same way `apps/workers` finds them. The agent's tool list names
 * `document.get` and `svj.get`, and the runtime has to be able to answer for them even in a run
 * that never calls them.
 */
export const loadEveryTool = (): Promise<number> =>
  loadToolsFrom([join(REPO_ROOT, 'packages/features/*/tools/*.ts')]);

/** An invoice under an id the fixture can name, taken as far as the deterministic half takes it. */
export const invoiceFrom = async (
  ctx: RequestContext,
  svjId: SvjId,
  scenario: string,
  id: InvoiceId,
): Promise<void> => {
  const one = scenarioNamed(scenario);
  const document = await storeDocument(ctx, {
    svjId,
    title: `Faktura ${one.extracted.externalNumber}`,
    category: 'invoice',
    body: await scenarioPdf(one),
    contentType: 'application/pdf',
    source: 'email',
    filename: 'faktura.pdf',
    linkedEntity: { type: 'invoice', id },
  });

  await createInvoice(ctx, {
    id,
    svjId,
    documentId: document.id,
    source: 'email',
    receivedAt: new Date('2026-09-02T07:30:00.000Z'),
    checks: { mail: { from: 'fakturace@dodavatel.test', subject: 'Faktura', via: 'simulated' } },
  });

  await processReceivedInvoice(ctx, id);
};
