import type { MatchMethod, MatchTarget } from '../domain/types';

/** A crown either way. Banks round, statements round, and a haller is nobody's disagreement. */
export const TOLERANCE = 1;

export const CERTAIN = 1;

export interface MatchCandidate {
  readonly id: string;
  readonly amount: number;
}

/** The invoice a payment might be settling, and whether it has been posted yet (ADR 0005). */
export interface InvoiceCandidate extends MatchCandidate {
  readonly status: string;
}

export type MatchDecision =
  | {
      readonly kind: 'matched';
      readonly targetType: MatchTarget;
      readonly targetId: string;
      readonly amount: number;
      readonly method: MatchMethod;
      readonly confidence: number;
    }
  | { readonly kind: 'residual'; readonly hint: string };

const fits = (paid: number, owed: number): boolean => Math.abs(paid - owed) <= TOLERANCE;

/**
 * Money in. The variable symbol says which unit, the amount says which month — and when the two
 * agree there is nothing left to decide, so no agent is asked (ADR 0004).
 *
 * A symbol that matches with the wrong amount is the interesting case: a double payment, a part
 * payment, or somebody paying two months at once. That is a question, and questions go to the
 * residual with a hint saying what was already established.
 */
export const decideIncome = (amount: number, prescription: MatchCandidate | null): MatchDecision => {
  if (prescription === null) return { kind: 'residual', hint: 'vs_unknown' };
  if (!fits(amount, prescription.amount)) return { kind: 'residual', hint: 'vs_only' };

  return {
    kind: 'matched',
    targetType: 'prescription',
    targetId: prescription.id,
    amount,
    method: 'vs_amount',
    confidence: CERTAIN,
  };
};

/**
 * Money out. An invoice that has not reached Pohoda yet is not one we may call paid: the accounting
 * entry is what `paid` follows, and marking it here would put the two out of step (ADR 0005).
 */
export const decideExpense = (amount: number, invoice: InvoiceCandidate | null): MatchDecision => {
  if (invoice === null) return { kind: 'residual', hint: 'vs_unknown' };
  if (!fits(Math.abs(amount), invoice.amount)) return { kind: 'residual', hint: 'vs_only' };
  if (invoice.status !== 'posted') return { kind: 'residual', hint: 'invoice_not_posted' };

  return {
    kind: 'matched',
    targetType: 'invoice',
    targetId: invoice.id,
    amount: Math.abs(amount),
    method: 'vs_amount',
    confidence: CERTAIN,
  };
};

/** Which of the two a movement is, decided by the sign the statement itself used. */
export const isIncome = (amount: number): boolean => amount > 0;
