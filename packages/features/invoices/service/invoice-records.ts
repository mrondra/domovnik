import { and, desc, eq, inArray } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import { withSvj, type RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import { events } from '../../../kernel/src/events/index';
import { newId, type SvjId } from '../../../kernel/src/ids/index';
import { invoiceReceived } from '../domain/events';
import { invoiceIdSchema, type InvoiceId } from '../domain/ids';
import type { InvoiceStatus } from '../domain/status';
import type { Invoice } from '../domain/types';
import { invoice } from '../schema/index';
import { assertReachable, reachable, reachableIds } from './reach';
import { toInvoice } from './rows';

export interface CreateInvoiceInput {
  readonly svjId: SvjId;
  readonly documentId: string;
  readonly source: string;
  readonly receivedAt: Date;
}

export interface ListInvoicesInput {
  readonly svjId?: SvjId | undefined;
  readonly status?: InvoiceStatus | undefined;
}

export const invoiceNotFound = (invoiceId: InvoiceId): NotFoundError =>
  new NotFoundError('Faktura nenalezena', { code: 'invoice_not_found', details: { invoiceId } });

/**
 * An invoice exists the moment its file does — `received` and nothing else known yet. Everything
 * after this is a step of the state machine, so there is one way in and one way on (task 014).
 */
export const createInvoice = (ctx: RequestContext, input: CreateInvoiceInput): Promise<Invoice> =>
  withTenant(ctx, async (tx) => {
    await assertReachable(ctx, input.svjId);
    const id = newId(invoiceIdSchema);

    const rows = await tx
      .insert(invoice)
      .values({
        id,
        tenantId: ctx.tenantId,
        svjId: input.svjId,
        createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
        status: 'received',
        documentId: input.documentId,
        receivedAt: input.receivedAt,
        source: input.source,
      })
      .returning();

    const row = rows[0];
    if (row === undefined) throw invoiceNotFound(id);
    const created = toInvoice(row);

    await audit.record(ctx, {
      action: 'finance.invoice.received',
      entity: 'invoice',
      entityId: created.id,
      reason: `Přijata faktura ze zdroje ${created.source}`,
      after: { documentId: created.documentId, source: created.source },
    });

    await events.emit(
      withSvj(ctx, created.svjId),
      invoiceReceived.create({
        invoiceId: created.id,
        svjId: created.svjId,
        documentId: created.documentId,
      }),
    );

    return created;
  });

export const getInvoice = (ctx: RequestContext, invoiceId: InvoiceId): Promise<Invoice> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select().from(invoice).where(eq(invoice.id, invoiceId)).limit(1);
    const row = rows[0];
    if (row === undefined) throw invoiceNotFound(invoiceId);

    const found = toInvoice(row);
    if (!(await reachable(ctx, found.svjId))) throw invoiceNotFound(invoiceId);
    return found;
  });

/** Across SVJ by default, narrowed to the ones the credential covers (ADR 0016). */
export const listInvoices = (
  ctx: RequestContext,
  input: ListInvoicesInput = {},
): Promise<readonly Invoice[]> =>
  withTenant(ctx, async (tx) => {
    const allowed = await reachableIds(ctx);
    if (allowed !== null && allowed.length === 0) return [];
    if (input.svjId !== undefined) await assertReachable(ctx, input.svjId);

    const scope = input.svjId === undefined ? allowed : [input.svjId];
    const rows = await tx
      .select()
      .from(invoice)
      .where(
        and(
          scope === null ? undefined : inArray(invoice.svjId, [...scope]),
          input.status === undefined ? undefined : eq(invoice.status, input.status),
        ),
      )
      .orderBy(desc(invoice.receivedAt));

    return rows.map(toInvoice);
  });
