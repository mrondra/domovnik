import { z } from 'zod';
import { defineEvent } from '../../../kernel/src/events/index';

/** Domain events are past tense and named `domena.entita.akce` (docs/engineering.md §3). */
export const transactionsImported = defineEvent(
  'finance.transactions.imported',
  z.object({
    svjId: z.uuid(),
    bankAccountId: z.uuid(),
    count: z.int().nonnegative(),
    newCount: z.int().nonnegative(),
  }),
);

/**
 * The residual, in one event for the whole import rather than one per movement. An agent is woken
 * once and given the batch: two hundred movements are one run, not two hundred (ADR 0004).
 */
export const transactionsUnmatched = defineEvent(
  'finance.transactions.unmatched',
  z.object({ svjId: z.uuid(), transactionIds: z.array(z.uuid()).min(1).readonly() }),
);

export const paymentMatched = defineEvent(
  'finance.payment.matched',
  z.object({
    svjId: z.uuid(),
    transactionId: z.uuid(),
    targetType: z.enum(['prescription', 'invoice']),
    targetId: z.uuid(),
    method: z.enum(['vs_amount', 'vs_only', 'agent', 'manual']),
  }),
);
