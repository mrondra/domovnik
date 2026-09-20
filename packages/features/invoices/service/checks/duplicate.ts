import { and, eq, ne } from 'drizzle-orm';
import type { RequestContext } from '../../../../kernel/src/context/index';
import { withTenant } from '../../../../kernel/src/db/index';
import type { Check } from '../../domain/checks';
import type { InvoiceId } from '../../domain/ids';
import type { Supplier } from '../../domain/types';
import { invoice } from '../../schema/index';
import type { ExtractedInvoice } from '../extraction/schema';

/**
 * The same supplier invoicing the same number twice. The unique index refuses the second write
 * anyway, so catching it here is what turns a constraint violation into something a person can read
 * — and what keeps the first invoice from being overwritten by a resend (task 016).
 */
export const duplicateCheck = async (
  ctx: RequestContext,
  invoiceId: InvoiceId,
  supplier: Supplier | null,
  extracted: ExtractedInvoice,
): Promise<Check | null> => {
  if (supplier === null || extracted.externalNumber.trim() === '') return null;

  const rows = await withTenant(ctx, (tx) =>
    tx
      .select({ id: invoice.id })
      .from(invoice)
      .where(
        and(
          eq(invoice.supplierId, supplier.id),
          eq(invoice.externalNumber, extracted.externalNumber),
          ne(invoice.id, invoiceId),
        ),
      )
      .limit(1),
  );

  const existing = rows[0];
  if (existing === undefined) return null;

  return {
    code: 'duplicate_number',
    severity: 'blocking',
    message: `Faktura ${extracted.externalNumber} od tohoto dodavatele už je založená.`,
    data: { externalNumber: extracted.externalNumber, invoiceId: existing.id },
  };
};
