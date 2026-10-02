import { eq } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { withTenant } from '../../../kernel/src/db/index';
import { newRowId } from '../../../kernel/src/ids/index';
import { building, department, departmentMember, svj, unit } from '../schema';
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
const MARK_DEPARTMENT = newRowId();
const ADDRESS = { street: 'Krátká 1', city: 'Praha 1', postalCode: '110 00' };

interface Isolation {
  readonly name: string;
  readonly table: PgTable;
  readonly marked: PgColumn;
  readonly markedValue: string;
  row(tenantId: string): Record<string, unknown>;
}

const TABLES: readonly Isolation[] = [
  {
    name: 'svj',
    table: svj,
    marked: svj.name,
    markedValue: MARK,
    row: (tenantId) => ({
      id: newRowId(),
      tenantId,
      name: MARK,
      ico: newRowId().slice(0, 8),
      ...ADDRESS,
    }),
  },
  {
    name: 'building',
    table: building,
    marked: building.label,
    markedValue: MARK,
    row: (tenantId) => ({ id: newRowId(), tenantId, svjId: newRowId(), label: MARK, street: 'Krátká 1' }),
  },
  {
    name: 'unit',
    table: unit,
    marked: unit.number,
    markedValue: MARK,
    row: (tenantId) => ({
      id: newRowId(),
      tenantId,
      svjId: newRowId(),
      buildingId: newRowId(),
      number: MARK,
      kind: 'apartment',
      shareNumerator: 1,
      shareDenominator: 2,
      floorArea: '50.00',
    }),
  },
  {
    name: 'department',
    table: department,
    marked: department.name,
    markedValue: MARK,
    row: (tenantId) => ({ id: newRowId(), tenantId, code: newRowId(), name: MARK }),
  },
  {
    name: 'departmentMember',
    table: departmentMember,
    marked: departmentMember.departmentId,
    markedValue: MARK_DEPARTMENT,
    row: (tenantId) => ({ id: newRowId(), tenantId, departmentId: MARK_DEPARTMENT, userId: newRowId() }),
  },
];

const insert = (one: Isolation, tenant: TestTenant, tenantId: string): Promise<void> =>
  withTenant(tenant.ctx, async (tx) => {
    await tx.insert(one.table).values(one.row(tenantId));
  });

const count = (one: Isolation, tenant: TestTenant): Promise<number> =>
  withTenant(
    tenant.ctx,
    async (tx) => (await tx.select().from(one.table).where(eq(one.marked, one.markedValue))).length,
  );

describe.each(TABLES)('$name isolation', (one) => {
  it('hides rows of another tenant', async () => {
    await insert(one, first, first.tenantId);

    expect(await count(one, second)).toBe(0);
    expect(await count(one, first)).toBeGreaterThan(0);
  });

  it('rejects a write carrying a foreign tenant_id', async () => {
    await expect(insert(one, first, second.tenantId)).rejects.toThrow();
  });
});
