import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { findPayableByVariableSymbol } from '../../invoices/index';
import { findByVariableSymbol, unitBalance } from '../../receivables/index';
import type { InvoiceCandidate, MatchCandidate } from './rules';

/** The prescription also says which unit paid, which is what the ledger entry is written against. */
export interface PrescriptionCandidate extends MatchCandidate {
  readonly unitId: string;
}

/**
 * The prescription a payment is most likely for: the one for the oldest month the unit has not
 * covered yet. A payer sending one amount every month is paying off the oldest debt first, which
 * is how a statement reads to a person too (task 020).
 */
export const prescriptionFor = async (
  ctx: RequestContext,
  svjId: SvjId,
  variableSymbol: string | undefined,
): Promise<PrescriptionCandidate | null> => {
  if (variableSymbol === undefined || variableSymbol === '') return null;

  const known = await findByVariableSymbol(ctx, { svjId, variableSymbol });
  if (known === null) return null;

  const balance = await unitBalance(ctx, { svjId, unitId: known.unitId });
  const period = balance.oldestUnpaidPeriod;
  if (period === undefined) return { id: known.id, amount: known.totalAmount, unitId: known.unitId };

  const owed = await findByVariableSymbol(ctx, { svjId, variableSymbol, period });
  return owed === null ? null : { id: owed.id, amount: owed.totalAmount, unitId: owed.unitId };
};

/** The invoice a payment out is most likely settling, whether or not it may be called paid yet. */
export const invoiceFor = async (
  ctx: RequestContext,
  svjId: SvjId,
  variableSymbol: string | undefined,
): Promise<InvoiceCandidate | null> => {
  if (variableSymbol === undefined || variableSymbol === '') return null;

  const found = await findPayableByVariableSymbol(ctx, { svjId, variableSymbol });
  if (found?.amountTotal == null) return null;

  return { id: found.id, amount: found.amountTotal, status: found.status };
};
