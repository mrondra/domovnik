import { DomainError } from '../../../kernel/src/errors/index';

export type InvoiceStatus =
  | 'received'
  | 'extracted'
  | 'needs_review'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'posted'
  | 'paid';

/**
 * The whole life of an invoice in one table (zadání kap. 4). Every step an invoice takes goes
 * through `assertTransition`, so no caller — controller, tool or agent — can invent a shortcut,
 * and `rejected` and `paid` are where it ends.
 */
export const TRANSITIONS: Readonly<Record<InvoiceStatus, readonly InvoiceStatus[]>> = {
  received: ['extracted', 'needs_review'],
  extracted: ['needs_review', 'pending_approval'],
  needs_review: ['extracted', 'pending_approval', 'rejected'],
  pending_approval: ['approved', 'rejected'],
  approved: ['posted'],
  posted: ['paid'],
  rejected: [],
  paid: [],
};

export const assertTransition = (from: InvoiceStatus, to: InvoiceStatus): void => {
  if (TRANSITIONS[from].includes(to)) return;

  throw new DomainError(`Faktura nemůže přejít z „${from}“ do „${to}“`, {
    code: 'invoice_transition_invalid',
    details: { from, to, allowed: TRANSITIONS[from] },
  });
};
