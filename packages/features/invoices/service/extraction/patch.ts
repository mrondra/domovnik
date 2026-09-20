import type { Check } from '../../domain/checks';
import type { Invoice, InvoicePatch } from '../../domain/types';
import { asIsoDay, type MatchedInvoice } from './match';
import type { ExtractedInvoice } from './schema';

const optional = (value: string | null): string | undefined =>
  value === null || value.trim() === '' ? undefined : value;

/** `invoice.checks` already holds where the file came from; the rules are added next to it. */
const withResults = (invoice: Invoice, results: readonly Check[]): unknown => ({
  ...(typeof invoice.checks === 'object' && invoice.checks !== null ? invoice.checks : {}),
  results,
});

/**
 * A number that belongs to an invoice which got here first is not written down again. The unique
 * index would refuse it anyway; leaving it off means the invoice still reaches `needs_review`
 * carrying the check that explains why, instead of failing on a constraint nobody can read.
 */
const isDuplicate = (results: readonly Check[]): boolean =>
  results.some((check) => check.code === 'duplicate_number');

/**
 * What one step of extraction writes onto the invoice. Nothing is invented: a field the model could
 * not read, or read in a shape the column cannot hold, is left as it was rather than guessed at.
 */
export const extractionPatch = (
  invoice: Invoice,
  extracted: ExtractedInvoice,
  matched: MatchedInvoice,
  results: readonly Check[],
): InvoicePatch => ({
  extraction: extracted,
  checks: withResults(invoice, results),
  ...(matched.supplier === null ? {} : { supplierId: matched.supplier.id }),
  ...(matched.contracts[0] === undefined ? {} : { contractId: matched.contracts[0].id }),
  ...(matched.budgetCategory === null ? {} : { budgetCategory: matched.budgetCategory }),
  externalNumber: isDuplicate(results) ? undefined : optional(extracted.externalNumber),
  variableSymbol: optional(extracted.variableSymbol),
  issuedOn: asIsoDay(extracted.issuedOn),
  dueOn: asIsoDay(extracted.dueOn),
  amountTotal: extracted.amountTotal,
  ...(extracted.amountVat === null ? {} : { amountVat: extracted.amountVat }),
  currency: optional(extracted.currency) ?? 'CZK',
});
