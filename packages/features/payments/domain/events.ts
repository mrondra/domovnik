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

/**
 * `amount` and `bookedOn` travel with the decision because what happens next is outside this
 * feature: `accounting-sync` liquidates the invoice in Pohoda and needs to know how much was paid
 * and when, and it may not read this feature's tables — only its events (task 025).
 *
 * Version 2 is that pair of fields. A version-1 event is still in some outbox somewhere and cannot
 * be answered — it never said how much was paid — so a subscriber skips it rather than failing on
 * it for ever (task 026).
 */
export const paymentMatched = defineEvent(
  'finance.payment.matched',
  z.object({
    svjId: z.uuid(),
    transactionId: z.uuid(),
    targetType: z.enum(['prescription', 'invoice']),
    targetId: z.uuid(),
    method: z.enum(['vs_amount', 'vs_only', 'agent', 'manual']),
    amount: z.number(),
    bookedOn: z.iso.date(),
  }),
  { version: 2 },
);
