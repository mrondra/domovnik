import { subscribe } from '../../../kernel/src/events/index';
import { supplierById } from '../../suppliers/index';
import { createTask } from '../../tasks/index';
import { codesOfSeverity } from '../domain/checks';
import { addWorkingDays } from '../domain/day';
import { invoiceNeedsReview } from '../domain/events';
import { invoiceIdSchema } from '../domain/ids';
import { reviewTaskContent } from '../domain/review-task';
import { getInvoice } from '../service/index';

const REVIEW_WORKING_DAYS = 2;

/**
 * An invoice a person has to look at becomes a task for finance, so the work shows up where the
 * department looks and not only in the invoice list.
 *
 * Delivery is at-least-once. The `dedupeKey` names the invoice, so a second delivery finds the
 * task already there and `createTask` answers it without creating another.
 */
export const needsReviewTask = subscribe(
  invoiceNeedsReview.name,
  async (ctx, event) => {
    const payload = invoiceNeedsReview.schema.parse(event.payload);
    const invoice = await getInvoice(ctx, invoiceIdSchema.parse(payload.invoiceId));
    const supplier = invoice.supplierId === null ? null : await supplierById(ctx, invoice.supplierId);
    const content = reviewTaskContent({
      supplierName: supplier?.name ?? null,
      externalNumber: invoice.externalNumber,
      reasons: payload.reasons,
      hasBlockingCheck: codesOfSeverity(invoice.checks, 'blocking').length > 0,
    });

    await createTask(ctx, {
      ...content,
      svjId: invoice.svjId,
      departmentCode: 'finance',
      dueOn: addWorkingDays(new Date().toISOString().slice(0, 10), REVIEW_WORKING_DAYS),
      origin: { type: 'invoice', id: invoice.id },
      dedupeKey: `invoice:${invoice.id}:needs_review`,
    });
  },
  { subscriber: 'invoices.needs-review-task' },
);
