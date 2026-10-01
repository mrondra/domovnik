import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { searchSuppliers, updateSupplier } from '../service/index';
import { seedSupplier, startSuppliersDb, withTestTenant, type TestDatabase } from './suppliers.fixture';

let database: TestDatabase;
let ctx: RequestContext;

beforeAll(async () => {
  database = await startSuppliersDb();
  ctx = (await withTestTenant()).ctx;

  const electrician = await seedSupplier(ctx, 'Elektro Novák');
  await updateSupplier(ctx, electrician, { specializations: ['elektrikar', 'revize_elektro'] });

  const lift = await seedSupplier(ctx, 'Výtahy Morava');
  await updateSupplier(ctx, lift, { specializations: ['vytahy'] });

  const inactive = await seedSupplier(ctx, 'Zaniklá firma');
  await updateSupplier(ctx, inactive, { specializations: ['vytahy'], isActive: false });
}, 180_000);

afterAll(async () => {
  await database.stop();
});

describe('searchSuppliers', () => {
  it('filters by obor, using the array containment the specialization column needs', async () => {
    const found = await searchSuppliers(ctx, { specialization: 'revize_elektro' });

    expect(found.map((one) => one.name)).toStrictEqual(['Elektro Novák']);
  });

  it('filters by a piece of the name, case-insensitively', async () => {
    const found = await searchSuppliers(ctx, { text: 'morava' });

    expect(found.map((one) => one.name)).toStrictEqual(['Výtahy Morava']);
  });

  it('excludes inactive suppliers by default', async () => {
    const found = await searchSuppliers(ctx, { specialization: 'vytahy' });

    expect(found.map((one) => one.name)).toStrictEqual(['Výtahy Morava']);
  });

  it('includes inactive suppliers when asked', async () => {
    const found = await searchSuppliers(ctx, { specialization: 'vytahy', activeOnly: false });

    expect(found.map((one) => one.name).sort()).toStrictEqual(['Výtahy Morava', 'Zaniklá firma']);
  });
});
