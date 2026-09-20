import { eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import type { InvoiceId } from '../domain/ids';
import { assertTransition, type InvoiceStatus } from '../domain/status';
import type { Invoice, InvoicePatch } from '../domain/types';
import { invoice } from '../schema/index';
import { getInvoice, invoiceNotFound } from './invoice-records';
import { asMoney, toInvoice } from './rows';
import { announce } from './transition-events';

type Columns = Partial<typeof invoice.$inferInsert>;

const DEFAULT_REASON = 'Změna stavu faktury';

/** Only the fields a step is allowed to fill in; `status` is the machine's, not the caller's. */
/**
 * A step taken inside an agent run is stamped with it, so the invoice can say what decided about
 * it and the detail screen can link to the trace (task 018). A step a person took overwrites
 * nothing: `ctx.agentRunId` is only set while an agent is running.
 */
const columnsOf = (patch: InvoicePatch, ctx: RequestContext): Columns => ({
  ...(ctx.agentRunId === undefined ? {} : { agentRunId: ctx.agentRunId }),
  ...(patch.supplierId === undefined ? {} : { supplierId: patch.supplierId }),
  ...(patch.contractId === undefined ? {} : { contractId: patch.contractId }),
  ...(patch.externalNumber === undefined ? {} : { externalNumber: patch.externalNumber }),
  ...(patch.variableSymbol === undefined ? {} : { variableSymbol: patch.variableSymbol }),
  ...(patch.issuedOn === undefined ? {} : { issuedOn: patch.issuedOn }),
  ...(patch.dueOn === undefined ? {} : { dueOn: patch.dueOn }),
  ...(patch.amountTotal === undefined ? {} : { amountTotal: asMoney(patch.amountTotal) }),
  ...(patch.amountVat === undefined ? {} : { amountVat: asMoney(patch.amountVat) }),
  ...(patch.currency === undefined ? {} : { currency: patch.currency }),
  ...(patch.budgetCategory === undefined ? {} : { budgetCategory: patch.budgetCategory }),
  ...(patch.extraction === undefined ? {} : { extraction: patch.extraction }),
  ...(patch.checks === undefined ? {} : { checks: patch.checks }),
  ...(patch.agentRunId === undefined ? {} : { agentRunId: patch.agentRunId }),
  ...(patch.approvalId === undefined ? {} : { approvalId: patch.approvalId }),
  ...(patch.accountingRef === undefined ? {} : { accountingRef: patch.accountingRef }),
});

/**
 * The one way an invoice moves. The step is checked against `TRANSITIONS` before anything is
 * written, the patch and the new status land in the same statement, and the audit row and the event
 * go inside the same transaction — so a refused step leaves no trace and an accepted one leaves
 * both (ADR 0011, docs/engineering.md §5).
 */
export const transition = (
  ctx: RequestContext,
  invoiceId: InvoiceId,
  to: InvoiceStatus,
  patch: InvoicePatch = {},
): Promise<Invoice> =>
  withTenant(ctx, async (tx) => {
    const before = await getInvoice(ctx, invoiceId);
    assertTransition(before.status, to);

    const rows = await tx
      .update(invoice)
      .set({ ...columnsOf(patch, ctx), status: to, updatedAt: new Date() })
      .where(eq(invoice.id, invoiceId))
      .returning();

    const row = rows[0];
    if (row === undefined) throw invoiceNotFound(invoiceId);
    const after = toInvoice(row);
    const reason = patch.reason ?? DEFAULT_REASON;

    await audit.record(ctx, {
      action: `finance.invoice.${to}`,
      entity: 'invoice',
      entityId: after.id,
      reason,
      before: { status: before.status },
      after: { status: after.status, amountTotal: after.amountTotal },
    });

    await announce(ctx, to, after, reason);
    return after;
  });
