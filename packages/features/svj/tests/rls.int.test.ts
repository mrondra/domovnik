import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { withTenant } from '../../../kernel/src/db/index';
import { newRowId } from '../../../kernel/src/ids/index';
import { building, department, svj, unit } from '../schema';
import { startSvjDb, withTestTenant, type TestDatabase, type TestTenant } from './svj.fixture';

let database: TestDatabase;
let first: TestTenant;
let second: TestTenant;

beforeAll(async () => {
  database = await startSvjDb();
  first = await withTestTenant('A');
  second = await withTestTenant('B');
}, 120_000);

afterAll(async () => {
  await database.stop();
});

const MARK = 'značka prvního správce';

interface Isolation {
  readonly name: string;
  insert(tenant: TestTenant, tenantId: string): Promise<void>;
  count(tenant: TestTenant): Promise<number>;
}

const TABLES: readonly Isolation[] = [
  {
    name: 'svj',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx.insert(svj).values({
          id: newRowId(),
          tenantId,
          name: MARK,
          ico: newRowId().slice(0, 8),
          street: 'Krátká 1',
          city: 'Praha 1',
          postalCode: '110 00',
        });
      }),
    count: (tenant) =>
      withTenant(tenant.ctx, async (tx) => (await tx.select().from(svj).where(eq(svj.name, MARK))).length),
  },
  {
    name: 'building',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx
          .insert(building)
          .values({ id: newRowId(), tenantId, svjId: newRowId(), label: MARK, street: 'Krátká 1' });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) => (await tx.select().from(building).where(eq(building.label, MARK))).length,
      ),
  },
  {
    name: 'unit',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx.insert(unit).values({
          id: newRowId(),
          tenantId,
          svjId: newRowId(),
          buildingId: newRowId(),
          number: MARK,
          kind: 'apartment',
          shareNumerator: 1,
          shareDenominator: 2,
          floorArea: '50.00',
        });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) => (await tx.select().from(unit).where(eq(unit.number, MARK))).length,
      ),
  },
  {
    name: 'department',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx.insert(department).values({ id: newRowId(), tenantId, code: newRowId(), name: MARK });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) => (await tx.select().from(department).where(eq(department.name, MARK))).length,
      ),
  },
];

describe.each(TABLES)('$name isolation', (table) => {
  it('hides rows of another tenant', async () => {
    await table.insert(first, first.tenantId);

    expect(await table.count(second)).toBe(0);
    expect(await table.count(first)).toBeGreaterThan(0);
  });

  it('rejects a write carrying a foreign tenant_id', async () => {
    await expect(table.insert(first, second.tenantId)).rejects.toThrow();
  });
});
