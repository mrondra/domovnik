import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { schema, withTenant } from '../../../kernel/src/db/index';
import { orderSeedModules, registeredSeeds, type SeedModule } from '../../../kernel/src/seed/index';
import { registeredDemoResets, type DemoResetDefinition } from '../domain/definition';
import type { ResetResult } from '../domain/types';

/**
 * Whatever `dependsOn` a feature's seed declared, its reset runs after the resets of what its seed
 * needed in place — the reverse of the order the seed ran in. A feature whose reset has no matching
 * seed goes last: nothing was ever ordered around it either way (task 028).
 */
export const demoResetOrder = (): readonly DemoResetDefinition[] => {
  const resets = registeredDemoResets();
  const byFeature = new Map(resets.map((reset) => [reset.feature, reset]));
  const seedsByName = new Map(registeredSeeds().map((seed) => [seed.name, seed]));

  const needed = new Map<string, SeedModule>();
  const include = (name: string): void => {
    if (needed.has(name)) return;
    const seed = seedsByName.get(name);
    if (seed === undefined) return;
    needed.set(name, seed);
    for (const dependency of seed.dependsOn ?? []) include(dependency);
  };
  for (const reset of resets) include(reset.feature);

  const ordered = orderSeedModules([...needed.values()])
    .filter((seed) => byFeature.has(seed.name))
    .map((seed) => byFeature.get(seed.name))
    .filter((reset): reset is DemoResetDefinition => reset !== undefined)
    .reverse();

  const withoutSeed = [...resets]
    .filter((reset) => !seedsByName.has(reset.feature))
    .sort((left, right) => left.feature.localeCompare(right.feature));

  return [...ordered, ...withoutSeed];
};

/**
 * Approvals, agent runs and anything still queued in the outbox: all of them are the kernel's own
 * and all of them are about rows that are going away. An event already handed to the queue cannot
 * be recalled — what is left of it is a handler that finds nothing and does nothing.
 */
const forgetDecisions = (ctx: RequestContext): Promise<number> =>
  withTenant(ctx, async (tx) => {
    const removed = await tx.delete(schema.approval).returning();
    await tx.delete(schema.agentRun);
    await tx.delete(schema.event);

    return removed.length;
  });

/**
 * Puts the tenant back to the state the seed leaves it in: everything a demonstration produced is
 * deleted, and everything the seed gave it stays. Nothing is re-seeded, because nothing the seed
 * wrote is touched.
 *
 * Audited like anything else somebody does: a reset that left no trace would be indistinguishable
 * from data loss (ADR 0011).
 */
export const resetDemo = async (ctx: RequestContext): Promise<ResetResult> => {
  let removed = await forgetDecisions(ctx);
  for (const reset of demoResetOrder()) {
    removed += await reset.run(ctx);
  }

  await withTenant(ctx, async () => {
    await audit.record(ctx, {
      action: 'demo.reset',
      entity: 'tenant',
      entityId: ctx.tenantId,
      reason: 'Reset dema',
      after: { removed },
    });
  });

  return { removed };
};
