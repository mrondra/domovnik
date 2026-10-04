import { subscribe } from '../../../kernel/src/events/index';
import { closeTasksForOrigin } from '../../tasks/index';
import { invoiceApproved, invoiceRejected } from '../domain/events';

/**
 * Once somebody has decided, the task that asked them to look is finished. Closing finds nothing the
 * second time, so at-least-once delivery changes nothing. The two events are two subscriptions, each
 * with its own id, because the id is half of the queue name.
 */
export const closeTaskOnApproval = subscribe(
  invoiceApproved.name,
  async (ctx, event) => {
    const payload = invoiceApproved.schema.parse(event.payload);

    await closeTasksForOrigin(
      ctx,
      { type: 'invoice', id: payload.invoiceId },
      { status: 'done', note: 'Faktura byla schválena' },
    );
  },
  { subscriber: 'invoices.close-review-task.approved' },
);

export const closeTaskOnRejection = subscribe(
  invoiceRejected.name,
  async (ctx, event) => {
    const payload = invoiceRejected.schema.parse(event.payload);

    await closeTasksForOrigin(
      ctx,
      { type: 'invoice', id: payload.invoiceId },
      { status: 'done', note: 'Faktura byla zamítnuta' },
    );
  },
  { subscriber: 'invoices.close-review-task.rejected' },
);
