import { z } from 'zod';
import { defineEvent } from '../../../kernel/src/events/index';
import { periodSchema } from './period';
import { entryReferenceSchema } from './schemas';

/** Domain events are past tense and named `domena.entita.akce` (docs/engineering.md §3). */
export const prescriptionsGenerated = defineEvent(
  'finance.prescription.generated',
  z.object({ svjId: z.uuid(), period: periodSchema, count: z.int().nonnegative() }),
);

/**
 * The payment is already in the ledger when this is emitted. It carries the reference rather than
 * an entry id, because what a subscriber recognises is the bank transaction it came from.
 */
export const paymentRecorded = defineEvent(
  'finance.payment.recorded',
  z.object({
    svjId: z.uuid(),
    unitId: z.uuid(),
    amount: z.number(),
    reference: entryReferenceSchema,
  }),
);
