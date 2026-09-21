import { AdapterError } from '../../../kernel/src/errors/index';
import { subscribe } from '../../../kernel/src/events/index';
import { logger } from '../../../kernel/src/logger/index';
import { invoiceApproved, invoiceIdSchema } from '../../invoices/index';
import { postInvoice } from '../service/index';

/**
 * An approved invoice belongs in the accounting (ADR 0005). Subscribing registers the handler;
 * `loadSubscribersFrom` finds the file by glob, so nothing imports it by hand (AGENTS.md §6).
 *
 * Delivery is at-least-once and `postInvoice` is idempotent: an invoice that is already `posted`,
 * or one this subscriber has already finished a job for, is left alone.
 *
 * The kernel turns any exception out of a handler into a pg-boss retry — five attempts with
 * backoff, whatever went wrong. That is right for an accounting that is busy and wrong for one
 * that refused the document, so a refusal is swallowed after it has been written down: it would
 * fail the same way five times, and the conflict is a person's to look at.
 */
export const postApprovedInvoice = subscribe(
  invoiceApproved.name,
  async (ctx, event) => {
    const payload = invoiceApproved.schema.parse(event.payload);
    const invoiceId = invoiceIdSchema.parse(payload.invoiceId);

    try {
      await postInvoice(ctx, invoiceId);
    } catch (error) {
      if (error instanceof AdapterError && !error.retryable) {
        logger().error({ invoiceId, err: error }, 'Účetnictví fakturu odmítlo');
        return;
      }
      throw error;
    }
  },
  { subscriber: 'accounting-sync.post-invoice' },
);
