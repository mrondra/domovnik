import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { newId, svjIdSchema } from '../../../kernel/src/ids/index';
import { startTestDb, withTestTenant, type TestDatabase } from '../../../kernel/src/testing/index';
import { contract, supplier } from '../schema';
import { createSupplier } from '../service/index';
import type { SupplierId } from '../domain/ids';

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

export { withTestTenant };
export type { TestDatabase };
