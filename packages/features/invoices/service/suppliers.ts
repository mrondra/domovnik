import { asc, eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { newId } from '../../../kernel/src/ids/index';
import { supplierIdSchema, type SupplierId } from '../domain/ids';
import type { Supplier } from '../domain/types';
import { supplier } from '../schema/index';
import { toSupplier } from './rows';

export interface CreateSupplierInput {
  readonly name: string;
  readonly ico: string;
  readonly dic?: string | undefined;
  readonly bankAccount?: string | undefined;
  readonly email?: string | undefined;
}

/**
 * A supplier belongs to the management company, not to an SVJ, so there is no reach check here: the
 * same lift service invoices several houses and the address book is one (zadání kap. 4). IČO is the
 * stable key — it is what an extracted invoice is recognised by, and what Pohoda syncs on.
 */
export const createSupplier = (ctx: RequestContext, input: CreateSupplierInput): Promise<Supplier> => {
  const created: Supplier = {
    id: newId(supplierIdSchema),
    name: input.name,
    ico: input.ico,
    dic: input.dic ?? null,
    bankAccount: input.bankAccount ?? null,
    email: input.email ?? null,
  };

  return withTenant(ctx, async (tx) => {
    await tx.insert(supplier).values({
      ...created,
      tenantId: ctx.tenantId,
      createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
    });

    await audit.record(ctx, {
      action: 'finance.supplier.created',
      entity: 'supplier',
      entityId: created.id,
      reason: 'Založen dodavatel',
      after: { name: created.name, ico: created.ico },
    });

    return created;
  });
};

/** What extraction asks with the IČO it read off the invoice (task 016). */
export const findSupplierByIco = (ctx: RequestContext, ico: string): Promise<Supplier | null> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select().from(supplier).where(eq(supplier.ico, ico)).limit(1);
    const row = rows[0];
    return row === undefined ? null : toSupplier(row);
  });

export const listSuppliers = (ctx: RequestContext): Promise<readonly Supplier[]> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select().from(supplier).orderBy(asc(supplier.name));
    return rows.map(toSupplier);
  });

/** One supplier by id, for a caller that already has the id off an invoice (task 018). */
export const supplierById = (ctx: RequestContext, supplierId: SupplierId): Promise<Supplier | null> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select().from(supplier).where(eq(supplier.id, supplierId)).limit(1);
    const row = rows[0];
    return row === undefined ? null : toSupplier(row);
  });
