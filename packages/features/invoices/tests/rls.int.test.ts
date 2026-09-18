import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ISOLATED_TABLES } from './rls.fixture';
import { startInvoicesDb, withTestTenant, type TestDatabase, type TestTenant } from './invoices.fixture';

let database: TestDatabase;
let first: TestTenant;
let second: TestTenant;

beforeAll(async () => {
  database = await startInvoicesDb();
  first = await withTestTenant('A');
  second = await withTestTenant('B');
}, 180_000);

afterAll(async () => {
  await database.stop();
});

describe.each(ISOLATED_TABLES)('$name isolation', (table) => {
  it('hides rows of another tenant', async () => {
    await table.insert(first, first.tenantId);

    expect(await table.count(second)).toBe(0);
    expect(await table.count(first)).toBeGreaterThan(0);
  });

  it('rejects a write carrying a foreign tenant_id', async () => {
    await expect(table.insert(first, second.tenantId)).rejects.toThrow();
  });
});
