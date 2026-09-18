import { eq } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { invoiceIdSchema, type InvoiceId } from '../domain/ids';
import { invoice } from '../schema/index';

/**
 * The invoice a stored file belongs to. It answers `null` rather than throwing: a document with no
 * invoice on it is not an error, it just means this file is not a duplicate of anything (task 015).
 */
export const invoiceOfDocument = (ctx: RequestContext, documentId: string): Promise<InvoiceId | null> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({ id: invoice.id })
      .from(invoice)
      .where(eq(invoice.documentId, documentId))
      .limit(1);

    const row = rows[0];
    return row === undefined ? null : invoiceIdSchema.parse(row.id);
  });
