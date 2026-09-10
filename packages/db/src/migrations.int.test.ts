import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runSql } from '../../kernel/src/db/admin';
import { tablesWithoutRls } from './audit-rls';
import { runMigrations } from './migrate';
import { startMigratedDb, type MigratedDatabase } from './database.fixture';

let database: MigratedDatabase;

beforeAll(async () => {
  database = await startMigratedDb();
}, 180_000);

afterAll(async () => {
  await database.stop();
});

describe('migrations', () => {
  it('leaves nothing pending when run a second time', async () => {
    await expect(runMigrations()).resolves.toBe(0);
  });

  // The audit reads pg_class and pg_policies, so it covers every table added from now on, whichever
  // package declares it.
  it('protects every tenant_id table with a forced policy', async () => {
    await expect(tablesWithoutRls()).resolves.toStrictEqual([]);
  });

  it('reports a tenant_id table created outside tenantTable()', async () => {
    await runSql(database.adminUrl, ['CREATE TABLE "smuggled" ("id" uuid PRIMARY KEY, "tenant_id" uuid)']);
    await expect(tablesWithoutRls()).resolves.toStrictEqual(['smuggled']);
    await runSql(database.adminUrl, ['DROP TABLE "smuggled"']);
  });
});
