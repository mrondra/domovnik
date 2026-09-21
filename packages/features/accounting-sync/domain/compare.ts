import type { AccountingInvoice, IsoDay } from './types';

export interface FieldDifference {
  readonly field: string;
  readonly ours: unknown;
  readonly theirs: unknown;
}

export interface OurInvoice {
  readonly amountTotal: number | null;
  readonly dueOn: IsoDay | null;
  readonly variableSymbol: string | null;
}

/** Rounding differences are not disagreements; a crown is. Amounts are in crowns everywhere. */
const TOLERANCE = 1;

const differs = (ours: number | null, theirs: number): boolean =>
  ours !== null && Math.abs(ours - theirs) >= TOLERANCE;

/**
 * Where our copy and the accounting's disagree about the same invoice. Only the three fields that
 * decide money and time are compared: what an invoice is for is our business, what it is worth and
 * when it is due is the books' (ADR 0005).
 *
 * A field we never filled in is not a disagreement — there is nothing to disagree with.
 */
export const invoiceDifferences = (
  ours: OurInvoice,
  theirs: AccountingInvoice,
): readonly FieldDifference[] => {
  const found: FieldDifference[] = [];

  if (differs(ours.amountTotal, theirs.amountTotal)) {
    found.push({ field: 'amountTotal', ours: ours.amountTotal, theirs: theirs.amountTotal });
  }
  if (ours.dueOn !== null && ours.dueOn !== theirs.dueOn) {
    found.push({ field: 'dueOn', ours: ours.dueOn, theirs: theirs.dueOn });
  }
  if (ours.variableSymbol !== null && ours.variableSymbol !== (theirs.variableSymbol ?? null)) {
    found.push({ field: 'variableSymbol', ours: ours.variableSymbol, theirs: theirs.variableSymbol ?? null });
  }

  return found;
};
