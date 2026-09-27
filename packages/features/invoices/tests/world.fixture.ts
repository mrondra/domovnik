import * as composedSchema from '../../../db/src/schema';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { TenantId } from '../../../kernel/src/ids/index';
import { loadSeedsFrom, orderSeedModules, registeredSeeds } from '../../../kernel/src/seed/index';
import {
  startTestDb,
  startTestStorage,
  withTestTenant,
  type TestDatabase,
  type TestStorage,
} from '../../../kernel/src/testing/index';

/**
 * Receiving a message writes the file through `documents`, which is not this feature's table to
 * import — so the test database gets the composed schema `pnpm db:generate` writes, the one place
 * that legitimately names every table there is. Storage is real for the same reason: a stubbed one
 * would prove nothing about the pair (task 015).
 */
export const TEST_SCHEMA: Record<string, unknown> = { ...composedSchema };

export interface InvoicesWorld {
  readonly database: TestDatabase;
  readonly storage: TestStorage;
  stop(): Promise<void>;
}

export const startInvoicesWorld = async (): Promise<InvoicesWorld> => {
  const database = await startTestDb(TEST_SCHEMA);
  const storage = await startTestStorage();

  return {
    database,
    storage,
    stop: async () => {
      await storage.stop();
      await database.stop();
    },
  };
};

const SEED_DIRS = ['svj', 'suppliers', 'invoices'];
const SEED_FILES = SEED_DIRS.map((name) => new URL(`../../${name}/seed/*.seed.ts`, import.meta.url).pathname);

/**
 * The feature seeds this one depends on (`dependsOn: ['suppliers', 'svj']`), found and ordered the
 * same way `pnpm db:seed` finds and orders them. A test may not reach into another feature's source
 * (docs/engineering.md §2) — the glob is the door that is open (mirrors `demo/tests/demo.fixture`).
 *
 * Filtered to these three names, not just narrowly globbed: `registeredSeeds()` is a process-wide
 * registry that other test files sharing this Vitest worker may already have populated (e.g. a
 * demo test loading every feature's seed) — this suite asserts exactly what `invoices`' own seed
 * produces, and a leftover seed from an unrelated feature would add scenarios it never asked for.
 */
export const runFeatureSeeds = async (tenant: {
  readonly tenantId: TenantId;
  readonly ctx: RequestContext;
}): Promise<void> => {
  await loadSeedsFrom(SEED_FILES);

  const wanted = registeredSeeds().filter((seed) => SEED_DIRS.includes(seed.name));
  for (const seed of orderSeedModules(wanted)) {
    await seed.run({ tenantId: tenant.tenantId, ctx: tenant.ctx });
  }
};

export { someSvj } from './invoices.fixture';
export { withTestTenant };
