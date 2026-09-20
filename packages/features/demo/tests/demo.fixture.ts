import * as composedSchema from '../../../db/src/schema';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { TenantId } from '../../../kernel/src/ids/index';
import { loadSeedsFrom, registeredSeeds } from '../../../kernel/src/seed/index';
import {
  applyTestEnv,
  startTestDb,
  startTestStorage,
  withTestTenant,
  type TestDatabase,
  type TestStorage,
} from '../../../kernel/src/testing/index';
import { SvjService } from '../../svj/index';

/**
 * A scenario delivers a real file to a real feature, so the world under test is the real one: every
 * table the composed schema knows about, and object storage the invoice was written into.
 */
export const TEST_SCHEMA: Record<string, unknown> = { ...composedSchema };

export interface DemoWorld {
  readonly database: TestDatabase;
  readonly storage: TestStorage;
  stop(): Promise<void>;
}

export const startDemoWorld = async (): Promise<DemoWorld> => {
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

/**
 * The recorded answers of the `invoices` suite; call it **after** the containers are up, because
 * `applyTestEnv` fills in a placeholder `DATABASE_URL` that `startTestDb` would then reuse.
 */
export const useRecordedLlm = (): void => {
  applyTestEnv({
    LLM_MODE: 'replay',
    LLM_FIXTURE_DIR: new URL('../../invoices/tests/fixtures/llm', import.meta.url).pathname,
  });
};

const SEED_FILES = new URL('../../*/seed/*.seed.ts', import.meta.url).pathname;

/**
 * The feature seeds, found the same way `pnpm db:seed` finds them. A test may not reach into
 * another feature's source (docs/engineering.md §2), and the glob is the door that is open.
 */
const runFeatureSeeds = async (tenant: { tenantId: TenantId; ctx: RequestContext }): Promise<void> => {
  await loadSeedsFrom([SEED_FILES]);

  for (const seed of registeredSeeds()) {
    await seed.run({ tenantId: tenant.tenantId, ctx: tenant.ctx });
  }
};

/** The three demo houses and everything the seed hangs off them. */
export const seedDemoTenantWith = async (): Promise<RequestContext> => {
  const tenant = await withTestTenant();
  const svj = new SvjService();

  for (const [index, name] of ['Kotlářská', 'Brandlova', 'Na Vyhlídce'].entries()) {
    await svj.createSvj(tenant.ctx, {
      name: `Společenství vlastníků ${name}`,
      ico: String(26_000_000 + index),
      address: { street: `${name} 1`, city: 'Praha', postalCode: '110 00' },
    });
  }

  await runFeatureSeeds(tenant);
  return tenant.ctx;
};
