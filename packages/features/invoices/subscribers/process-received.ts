import { subscribe } from '../../../kernel/src/events/index';
import { invoiceReceived } from '../domain/events';
import { invoiceIdSchema } from '../domain/ids';
import { processReceivedInvoice } from '../service/index';

/**
 * Subscribing registers the handler; `loadSubscribersFrom` finds the file by glob, so nothing
 * imports it by hand (AGENTS.md §6). The subscriber id is half of the queue name — renaming it
 * means a new queue, and the jobs left in the old one have nobody to take them.
 *
 * This is the deterministic half of processing an invoice (ADR 0004): reading the file, extracting
 * it and running the checks needs no agent, and what it cannot settle it announces as
 * `finance.invoice.extracted` or `finance.invoice.needs_review` for one (task 017).
 *
 * Delivery is at-least-once. `processReceivedInvoice` answers an invoice that has already moved on
 * without touching it, which is what makes a second delivery free.
 */
export const processReceived = subscribe(
  invoiceReceived.name,
  async (ctx, event) => {
    const payload = invoiceReceived.schema.parse(event.payload);
    await processReceivedInvoice(ctx, invoiceIdSchema.parse(payload.invoiceId));
  },
  { subscriber: 'invoices.process-received' },
);
