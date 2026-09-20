import type { RequestContext } from '../../../../kernel/src/context/index';
import { withTenant } from '../../../../kernel/src/db/index';
import { documentIdSchema, readDocument } from '../../../documents/index';
import type { Check } from '../../domain/checks';
import type { InvoiceId } from '../../domain/ids';
import type { Invoice } from '../../domain/types';
import { runChecks } from '../checks/index';
import { getInvoice } from '../invoice-records';
import { transition } from '../transitions';
import { extractInvoice } from './extract';
import { matchInvoice } from './match';
import { extractionPatch } from './patch';
import { NO_TEXT, pdfText } from './text';

const UNREADABLE: Check = {
  code: NO_TEXT,
  severity: 'blocking',
  message: 'PDF neobsahuje čitelný text; přečíst ho musí člověk (OCR není v rozsahu).',
};

const blocked = (checks: readonly Check[]): boolean => checks.some((check) => check.severity === 'blocking');

/**
 * Everything that can be done about an invoice without asking anyone: read the file, have the model
 * turn it into fields, work out who sent it and under which contract, and run the rules. What comes
 * out is either an invoice that checked itself or the reason a person has to look at it.
 *
 * It answers the invoice unchanged when it is no longer `received`: delivery is at-least-once, and
 * a second delivery must not extract the same file twice (docs/engineering.md §3).
 */
export const processReceivedInvoice = (ctx: RequestContext, invoiceId: InvoiceId): Promise<Invoice> =>
  withTenant(ctx, async () => {
    const invoice = await getInvoice(ctx, invoiceId);
    if (invoice.status !== 'received') return invoice;

    const document = await readDocument(ctx, documentIdSchema.parse(invoice.documentId));
    const text = await pdfText(document.body).catch(() => null);
    if (text === null) {
      return transition(ctx, invoiceId, 'needs_review', {
        checks: { ...asObject(invoice.checks), results: [UNREADABLE] },
        reason: UNREADABLE.message,
      });
    }

    const extracted = await extractInvoice(ctx, text);
    const matched = await matchInvoice(ctx, invoice.svjId, extracted);
    const results = await runChecks(ctx, {
      invoiceId,
      svjId: invoice.svjId,
      extracted,
      supplier: matched.supplier,
      contracts: matched.contracts,
      budgetCategory: matched.budgetCategory,
      now: new Date(),
    });

    const patch = extractionPatch(invoice, extracted, matched, results);
    const to = blocked(results) ? 'needs_review' : 'extracted';

    return transition(ctx, invoiceId, to, { ...patch, reason: reasonFor(to, results) });
  });

const asObject = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? { ...value } : {};

const reasonFor = (to: 'needs_review' | 'extracted', results: readonly Check[]): string =>
  to === 'extracted'
    ? 'Faktura přečtena a zkontrolována'
    : `Kontroly zastavily fakturu: ${results
        .filter((check) => check.severity === 'blocking')
        .map((check) => check.code)
        .join(', ')}`;
