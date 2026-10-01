import { and, arrayContains, desc, eq, gte, isNull, lte, or } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { asDay } from '../domain/day';
import type { Specialization } from '../domain/specializations';
import type { Contract, Supplier } from '../domain/types';
import { contract, supplier } from '../schema';
import { assertReachable } from './reach';
import { toContract, toSupplier } from './rows';

export interface ContractedSupplierForInput {
  readonly svjId: SvjId;
  readonly specialization: Specialization;
  readonly on: Date;
}

export interface ContractedSupplier {
  readonly supplier: Supplier;
  readonly contract: Contract;
}

/**
 * Does the SVJ have a contracted firm for an obor, right now — what `inspections` (task 037) and
 * `quotes` ask instead of walking `findContractsForSupplier` themselves. Two contracts covering the
 * same obor is not an error (a handover between firms overlaps on purpose); the newer `validFrom`
 * wins, because that is the one the SVJ most recently signed.
 */
export const contractedSupplierFor = (
  ctx: RequestContext,
  input: ContractedSupplierForInput,
): Promise<ContractedSupplier | null> =>
  withTenant(ctx, async (tx) => {
    await assertReachable(ctx, input.svjId);
    const on = asDay(input.on);

    const rows = await tx
      .select()
      .from(contract)
      .where(
        and(
          eq(contract.svjId, input.svjId),
          arrayContains(contract.covers, [input.specialization]),
          lte(contract.validFrom, on),
          or(isNull(contract.validTo), gte(contract.validTo, on)),
        ),
      )
      .orderBy(desc(contract.validFrom))
      .limit(1);

    const row = rows[0];
    if (row === undefined) return null;
    const foundContract = toContract(row);

    const supplierRows = await tx
      .select()
      .from(supplier)
      .where(eq(supplier.id, foundContract.supplierId))
      .limit(1);
    const supplierRow = supplierRows[0];
    if (supplierRow === undefined) return null;

    return { supplier: toSupplier(supplierRow), contract: foundContract };
  });
