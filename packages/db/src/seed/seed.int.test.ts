import { count, eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { withSystem } from '../../../kernel/src/db/index';
import { tenant, user } from '../../../kernel/src/db/schema/index';
import { ROLES } from '../../../kernel/src/identity/index';
import { clearSeeds, defineSeed, type SeedContext } from '../../../kernel/src/seed/index';
import { demoUserEmail } from './demo-users';
import { DEMO_TENANT_NAME } from './demo-tenant';
import { runSeed } from './index';
import { startTestStorage, type TestStorage } from '../../../kernel/src/testing/index';
import { startMigratedDb, type MigratedDatabase } from '../database.fixture';

let database: MigratedDatabase;
let storage: TestStorage;

/**
 * Object storage as well as a database: a feature seed writes files now — `invoices` puts the demo
 * invoices where the `demo` feature can find them — so `runSeed` needs somewhere to put them
 * (task 019). Storage comes up second, because `startTestDb` reuses any `DATABASE_URL` it finds.
 */
beforeAll(async () => {
  database = await startMigratedDb();
  storage = await startTestStorage();
}, 300_000);

afterAll(async () => {
  await storage.stop();
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

/** Only the kernel's own rows: a feature seed is free to add people of its own (task 007). */
const kernelDemoUsers = (): Promise<number> =>
  withSystem({ reason: 'test' }, async (tx) => {
    const rows = await tx
      .select({ total: count() })
      .from(user)
      .where(inArray(user.email, ROLES.map(demoUserEmail)));
    return rows[0]?.total ?? 0;
  });

describe('runSeed', () => {
  it('creates the demo tenant with one user per role', async () => {
    clearSeeds();
    await runSeed();

    await expect(demoTenants()).resolves.toBe(1);
    await expect(kernelDemoUsers()).resolves.toBe(ROLES.length);
  });

  it('adds nothing when it runs again', async () => {
    clearSeeds();
    await runSeed();
    const afterFirstRun = await users();

    await runSeed();

    await expect(demoTenants()).resolves.toBe(1);
    await expect(users()).resolves.toBe(afterFirstRun);
  });

  // Declaring the seed is what registers it, so this covers the whole path a feature will take:
  // defineSeed -> discovery -> dependency order -> run.
  it('runs a declared feature seed after the feature it depends on', async () => {
    const visited: string[] = [];
    const declare = (name: string, dependsOn: readonly string[]): void => {
      defineSeed({
        name,
        dependsOn,
        run: (context: SeedContext) => {
          visited.push(`${name}:${context.tenantId}`);
          return Promise.resolve();
        },
      });
    };

    clearSeeds();
    declare('invoices', ['svj']);
    declare('svj', []);
    await expect(runSeed()).resolves.toBe(2);

    expect(visited.map((entry) => entry.split(':')[0])).toStrictEqual(['svj', 'invoices']);
    clearSeeds();
  });
});
