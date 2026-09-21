import { and, asc, eq, inArray } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { InvoiceStatus } from '../domain/status';
import type { Invoice } from '../domain/types';
import { invoice } from '../schema/index';
import { assertReachable } from './reach';
import { toInvoice } from './rows';

export interface PayableQuery {
  readonly svjId: SvjId;
  readonly variableSymbol: string;
}

/** An invoice is a candidate for a payment once somebody has undertaken to pay it (task 020). */
const PAYABLE: readonly InvoiceStatus[] = ['approved', 'posted'];

/**
 * The invoice a payment out might be settling, found the way a bank statement identifies it: by the
 * variable symbol. `posted` first, because an invoice that has reached Pohoda is the one that may
 * be called paid — whether it may is `payments`' rule to apply, not this query's (ADR 0005).
 */
export const findPayableByVariableSymbol = (
  ctx: RequestContext,
  query: PayableQuery,
): Promise<Invoice | null> =>
  withTenant(ctx, async (tx) => {
    await assertReachable(ctx, query.svjId);

    const rows = await tx
      .select()
      .from(invoice)
      .where(
        and(
          eq(invoice.svjId, query.svjId),
          eq(invoice.variableSymbol, query.variableSymbol),
          inArray(invoice.status, [...PAYABLE]),
        ),
      )
      .orderBy(asc(invoice.status), asc(invoice.dueOn))
      .limit(1);

    const row = rows[0];
    return row === undefined ? null : toInvoice(row);
  });
