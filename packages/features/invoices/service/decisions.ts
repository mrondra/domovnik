import { eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import type { ApprovalId } from '../../../kernel/src/ids/index';
import { SvjService } from '../../svj/index';
import type { InvoiceId } from '../domain/ids';
import type { Invoice } from '../domain/types';
import { invoice } from '../schema/index';
import { getInvoice } from './invoice-records';
import { transition } from './transitions';

/** `svj` hands its record out through the injectable class only, and that class holds no state. */
const svj = new SvjService();

export interface ReviewNoteInput {
  readonly invoiceId: InvoiceId;
  readonly note: string;
  readonly missing: readonly string[];
}

const DAYS_TO_DECIDE = 7;
const DAY = 24 * 60 * 60 * 1000;

/** Who may decide about this SVJ's money: the committee elected to it (zadání kap. 9). */
export const committeeOf = async (ctx: RequestContext, invoiceId: InvoiceId): Promise<readonly string[]> => {
  const found = await getInvoice(ctx, invoiceId);
  const record = await svj.getById(ctx, found.svjId);
  return record.committee;
};

export const decideBy = (now: Date = new Date()): Date => new Date(now.getTime() + DAYS_TO_DECIDE * DAY);

/**
 * The invoice is now waiting on somebody. It is recorded the moment the approval exists, not when
 * it is decided — otherwise an invoice sitting in a committee member's inbox would still look
 * untouched to everybody else (ADR 0015).
 */
export const requestApproval = (
  ctx: RequestContext,
  invoiceId: InvoiceId,
  approvalId: ApprovalId,
): Promise<Invoice> =>
  transition(ctx, invoiceId, 'pending_approval', {
    approvalId,
    reason: 'Návrh předán výboru ke schválení',
  });

export const approveInvoice = (ctx: RequestContext, invoiceId: InvoiceId, reason: string): Promise<Invoice> =>
  transition(ctx, invoiceId, 'approved', { reason });

export const rejectInvoice = (ctx: RequestContext, invoiceId: InvoiceId, reason: string): Promise<Invoice> =>
  transition(ctx, invoiceId, 'rejected', { reason });

/**
 * What the agent could not settle, written where whoever picks the invoice up will look. This one
 * does not go through `transition`, because nothing moves: the invoice is already in
 * `needs_review`, and the note stands in for the task phase 2 will raise instead (task 017).
 */
export const flagForReview = (ctx: RequestContext, input: ReviewNoteInput): Promise<Invoice> =>
  withTenant(ctx, async () => {
    const found = await getInvoice(ctx, input.invoiceId);
    const checks = typeof found.checks === 'object' && found.checks !== null ? found.checks : {};
    const reviewNote = { note: input.note, missing: input.missing };

    await withTenant(ctx, (tx) =>
      tx
        .update(invoice)
        .set({ checks: { ...checks, reviewNote }, updatedAt: new Date() })
        .where(eq(invoice.id, input.invoiceId)),
    );

    await audit.record(ctx, {
      action: 'finance.invoice.review_noted',
      entity: 'invoice',
      entityId: input.invoiceId,
      reason: input.note,
      after: reviewNote,
    });

    return getInvoice(ctx, input.invoiceId);
  });
