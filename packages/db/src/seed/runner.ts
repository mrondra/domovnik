import { logger } from '../../../kernel/src/logger/index';
import { seedDemoTenant } from './demo-tenant';
import { discoverSeedModules } from './discovery';
import { orderSeedModules } from './order';

/**
 * The demo tenant is provisioned first — it is what every other seed writes into. Feature seeds then
 * run in dependency order, each of them idempotent by its own stable keys (engineering.md §8).
 */
export const runSeed = async (): Promise<number> => {
  const context = await seedDemoTenant();
  const modules = orderSeedModules(await discoverSeedModules());

  for (const module of modules) {
    await module.run(context);
  }

  logger().info({ tenantId: context.tenantId, features: modules.length }, 'Seed finished');
  return modules.length;
};
