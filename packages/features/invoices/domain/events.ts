import { z } from 'zod';
import { defineEvent } from '../../../kernel/src/events/index';
import { budgetCategorySchema } from './schemas';

const onInvoice = { invoiceId: z.uuid(), svjId: z.uuid() };

/** Domain events are past tense and named `domena.entita.akce` (docs/engineering.md §3). */
export const invoiceReceived = defineEvent(
  'finance.invoice.received',
  z.object({ ...onInvoice, documentId: z.uuid() }),
);

/**
 * The one event of this feature an agent answers rather than a subscriber: the deterministic checks
 * could not settle the invoice and say why (ADR 0004, task 016).
 */
export const invoiceNeedsReview = defineEvent(
  'finance.invoice.needs_review',
  z.object({ ...onInvoice, reasons: z.array(z.string().min(1)).readonly() }),
);

/** What `payments` (020) needs in order to recognise the transfer that settles this invoice. */
export const invoiceApproved = defineEvent(
  'finance.invoice.approved',
  z.object({
    ...onInvoice,
    supplierId: z.uuid(),
    amountTotal: z.number(),
    dueOn: z.iso.date(),
    variableSymbol: z.string().nullable(),
    budgetCategory: budgetCategorySchema.nullable(),
  }),
);

export const invoiceRejected = defineEvent(
  'finance.invoice.rejected',
  z.object({ ...onInvoice, reason: z.string().min(1) }),
);

/** `accountingRef` is the id the invoice got in Pohoda; without it nothing is posted (ADR 0005). */
export const invoicePosted = defineEvent(
  'finance.invoice.posted',
  z.object({ ...onInvoice, accountingRef: z.string().min(1) }),
);

export const invoicePaid = defineEvent('finance.invoice.paid', z.object({ ...onInvoice }));
