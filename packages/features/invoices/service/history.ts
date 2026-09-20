import { and, desc, eq } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { SupplierId } from '../domain/ids';
import type { InvoiceStatus } from '../domain/status';
import { invoiceStatusSchema } from '../domain/schemas';
import { invoice } from '../schema/index';
import { assertReachable } from './reach';

export interface SupplierHistoryInput {
  readonly svjId: SvjId;
  readonly supplierId: SupplierId;
  readonly limit?: number | undefined;
}

export interface HistoricInvoice {
  readonly issuedOn: string | null;
  readonly amountTotal: number | null;
  readonly externalNumber: string | null;
  readonly status: InvoiceStatus;
}

export const HISTORY_LENGTH = 12;

/**
 * What this supplier has invoiced this SVJ before, newest first. It is the context a person uses to
 * tell an ordinary month from an unusual one, and it is the reason the agent can write "the same as
 * every month" rather than repeating the amount (task 017).
 */
export const supplierHistory = (
  ctx: RequestContext,
  input: SupplierHistoryInput,
): Promise<readonly HistoricInvoice[]> =>
  withTenant(ctx, async (tx) => {
    await assertReachable(ctx, input.svjId);

    const rows = await tx
      .select({
        issuedOn: invoice.issuedOn,
        amountTotal: invoice.amountTotal,
        externalNumber: invoice.externalNumber,
        status: invoice.status,
      })
      .from(invoice)
      .where(and(eq(invoice.svjId, input.svjId), eq(invoice.supplierId, input.supplierId)))
      .orderBy(desc(invoice.issuedOn), desc(invoice.receivedAt))
      .limit(input.limit ?? HISTORY_LENGTH);

    return rows.map((row) => ({
      issuedOn: row.issuedOn,
      amountTotal: row.amountTotal === null ? null : Number(row.amountTotal),
      externalNumber: row.externalNumber,
      status: invoiceStatusSchema.parse(row.status),
    }));
  });
