import { AdapterError } from '../../../kernel/src/errors/index';
import { subscribe } from '../../../kernel/src/events/index';
import { logger } from '../../../kernel/src/logger/index';
import { invoiceIdSchema } from '../../invoices/index';
import { paymentMatched } from '../../payments/index';
import { liquidateInvoice } from '../service/index';

/**
 * A payment that settled an invoice is told to the accounting as its liquidation. A payment for a
 * prescription is not: that is the owners' ledger, which is ours and not Pohoda's (ADR 0005).
 *
 * Delivery is at-least-once; `liquidateInvoice` finds its own finished job and does nothing twice.
 * A refusal is written down and swallowed for the same reason as in `post-invoice.ts`.
 */
export const liquidateMatched = subscribe(
  paymentMatched.name,
  async (ctx, event) => {
    const payload = paymentMatched.schema.parse(event.payload);
    if (payload.targetType !== 'invoice') return;

    const invoiceId = invoiceIdSchema.parse(payload.targetId);

    try {
      await liquidateInvoice(ctx, {
        invoiceId,
        amount: payload.amount,
        paidOn: payload.bookedOn,
        bankRef: payload.transactionId,
      });
    } catch (error) {
      if (error instanceof AdapterError && !error.retryable) {
        logger().error({ invoiceId, err: error }, 'Účetnictví likvidaci odmítlo');
        return;
      }
      throw error;
    }
  },
  { subscriber: 'accounting-sync.liquidate' },
);
