import { logger } from '../../../kernel/src/logger/index';
import { discoverSeedModules } from './discovery';
import { seedKernel } from './kernel';
import { orderSeedModules } from './order';
import type { SeedModule } from './types';

/**
 * The kernel seed runs first — it owns the tenant every other seed writes into. Feature seeds then
 * run in dependency order, each of them idempotent by its own stable keys (engineering.md §8).
 */
export const runSeed = async (modules?: readonly SeedModule[]): Promise<number> => {
  const context = await seedKernel();
  const discovered = modules ?? (await discoverSeedModules());

  for (const module of orderSeedModules(discovered)) {
    await module.run(context);
  }

  logger().info({ tenantId: context.tenantId, features: discovered.length }, 'Seed finished');
  return discovered.length;
};
