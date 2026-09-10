import { count, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { withSystem } from '../../../kernel/src/db/index';
import { tenant, user } from '../../../kernel/src/db/schema/index';
import { ROLES } from '../../../kernel/src/identity/index';
import { DEMO_TENANT_NAME, runSeed, type SeedContext, type SeedModule } from './index';
import { startMigratedDb, type MigratedDatabase } from '../database.fixture';

let database: MigratedDatabase;

beforeAll(async () => {
  database = await startMigratedDb();
}, 180_000);

afterAll(async () => {
  await database.stop();
});

const demoTenants = (): Promise<number> =>
  withSystem({ reason: 'test' }, async (tx) => {
    const rows = await tx.select({ total: count() }).from(tenant).where(eq(tenant.name, DEMO_TENANT_NAME));
    return rows[0]?.total ?? 0;
  });

const users = (): Promise<number> =>
  withSystem({ reason: 'test' }, async (tx) => {
    const rows = await tx.select({ total: count() }).from(user);
    return rows[0]?.total ?? 0;
  });

describe('runSeed', () => {
  it('creates the demo tenant with one user per role', async () => {
    await runSeed([]);

    await expect(demoTenants()).resolves.toBe(1);
    await expect(users()).resolves.toBe(ROLES.length);
  });

  it('adds nothing when it runs again', async () => {
    await runSeed([]);
    await runSeed([]);

    await expect(demoTenants()).resolves.toBe(1);
    await expect(users()).resolves.toBe(ROLES.length);
  });

  it('runs a feature seed after the feature it depends on', async () => {
    const visited: string[] = [];
    const module = (name: string, dependsOn: readonly string[]): SeedModule => ({
      name,
      dependsOn,
      run: (context: SeedContext) => {
        visited.push(`${name}:${context.tenantId}`);
        return Promise.resolve();
      },
    });

    await runSeed([module('invoices', ['svj']), module('svj', [])]);

    expect(visited.map((entry) => entry.split(':')[0])).toStrictEqual(['svj', 'invoices']);
  });
});
