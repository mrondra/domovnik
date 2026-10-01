import { eq } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { newId, svjIdSchema } from '../../../kernel/src/ids/index';
import { startTestDb, withTestTenant, type TestDatabase } from '../../../kernel/src/testing/index';
import type { IsoDay } from '../domain/day';
import { contractIdSchema, type ContractId, type SupplierId } from '../domain/ids';
import type { Specialization } from '../domain/specializations';
import { contract, supplier } from '../schema';
import { createSupplier } from '../service/index';

export const featureSchema = { supplier, contract };

export const startSuppliersDb = (): Promise<TestDatabase> => startTestDb(featureSchema);

/** This feature stores an SVJ id but never joins to the table, so a fresh one is a whole house. */
export const someSvj = (): SvjId => newId(svjIdSchema);

let sequence = 0;

export const seedSupplier = async (ctx: RequestContext, name = 'Výtahy Praha'): Promise<SupplierId> => {
  sequence += 1;
  const created = await createSupplier(ctx, {
    name,
    ico: String(20_000_000 + sequence),
    bankAccount: '2801234567/2010',
  });
  return created.id;
};

/** For asserting a re-seed left a row untouched: no spurious `finance.supplier.updated` audit. */
export const supplierUpdatedAt = async (ctx: RequestContext, supplierId: SupplierId): Promise<Date> => {
  const rows = await withTenant(ctx, (tx) =>
    tx.select({ updatedAt: supplier.updatedAt }).from(supplier).where(eq(supplier.id, supplierId)),
  );
  const row = rows[0];
  if (row === undefined) throw new RangeError(`no supplier row for ${supplierId}`);
  return row.updatedAt;
};

export interface SeedContractInput {
  readonly svjId: SvjId;
  readonly supplierId: SupplierId;
  readonly subject?: string;
  readonly validFrom: IsoDay;
  readonly validTo?: IsoDay | null;
  readonly covers?: readonly Specialization[];
}

/**
 * A contract with `covers`, inserted straight into the table rather than through `createContract`
 * (task 030 subtask 2 does not own `service/contracts.ts`, so its input stays as subtask 1 left it).
 */
export const seedContract = async (ctx: RequestContext, input: SeedContractInput): Promise<ContractId> => {
  const id = newId(contractIdSchema);

  await withTenant(ctx, async (tx) => {
    await tx.insert(contract).values({
      id,
      tenantId: ctx.tenantId,
      svjId: input.svjId,
      supplierId: input.supplierId,
      subject: input.subject ?? 'Smlouva o dílo',
      budgetCategory: 'revize',
      validFrom: input.validFrom,
      validTo: input.validTo ?? null,
      covers: [...(input.covers ?? [])],
      createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
    });
  });

  return id;
};

export { withTestTenant };
export type { TestDatabase };
