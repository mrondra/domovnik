import { eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import type { SupplierId } from '../domain/ids';
import type { Specialization } from '../domain/specializations';
import type { Supplier } from '../domain/types';
import { supplier } from '../schema';
import { toSupplier } from './rows';

export interface UpdateSupplierInput {
  readonly name?: string | undefined;
  readonly dic?: string | null | undefined;
  readonly bankAccount?: string | null | undefined;
  readonly email?: string | null | undefined;
  readonly specializations?: readonly Specialization[] | undefined;
  readonly phone?: string | null | undefined;
  readonly contactPerson?: string | null | undefined;
  readonly isActive?: boolean | undefined;
}

const notFound = (supplierId: SupplierId): NotFoundError =>
  new NotFoundError('Dodavatel nenalezen', { code: 'supplier_not_found', details: { supplierId } });

/**
 * A patch, not a replace: a field left out of `patch` keeps its current value. This is what lets
 * the seed (task 030) fill in `specializations`/`covers` on a supplier that task 029 already
 * created, and what the PATCH endpoint (subtask 4) exposes.
 */
export const updateSupplier = (
  ctx: RequestContext,
  supplierId: SupplierId,
  patch: UpdateSupplierInput,
): Promise<Supplier> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select().from(supplier).where(eq(supplier.id, supplierId)).limit(1);
    const row = rows[0];
    if (row === undefined) throw notFound(supplierId);
    const before = toSupplier(row);

    const after: Supplier = {
      ...before,
      name: patch.name ?? before.name,
      dic: patch.dic === undefined ? before.dic : patch.dic,
      bankAccount: patch.bankAccount === undefined ? before.bankAccount : patch.bankAccount,
      email: patch.email === undefined ? before.email : patch.email,
      specializations: patch.specializations ?? before.specializations,
      phone: patch.phone === undefined ? before.phone : patch.phone,
      contactPerson: patch.contactPerson === undefined ? before.contactPerson : patch.contactPerson,
      isActive: patch.isActive ?? before.isActive,
    };

    await tx
      .update(supplier)
      .set({
        name: after.name,
        dic: after.dic,
        bankAccount: after.bankAccount,
        email: after.email,
        specializations: [...after.specializations],
        phone: after.phone,
        contactPerson: after.contactPerson,
        isActive: after.isActive,
        updatedAt: new Date(),
      })
      .where(eq(supplier.id, supplierId));

    await audit.record(ctx, {
      action: 'finance.supplier.updated',
      entity: 'supplier',
      entityId: supplierId,
      reason: 'Změna údajů dodavatele',
      before: { name: before.name, specializations: before.specializations, isActive: before.isActive },
      after: { name: after.name, specializations: after.specializations, isActive: after.isActive },
    });

    return after;
  });
