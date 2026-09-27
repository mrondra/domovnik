import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { TenantId } from '../../../kernel/src/ids/index';
import { withTestTenant } from '../../../kernel/src/testing/index';
import { dailyTickSeed } from '../seed/daily-tick.seed';
import { listScenarios } from '../service/index';
import { startDemoWorld, type DemoWorld } from './demo.fixture';

let world: DemoWorld;
let tenantId: TenantId;
let ctx: RequestContext;

beforeAll(async () => {
  world = await startDemoWorld();
  const tenant = await withTestTenant();
  tenantId = tenant.tenantId;
  ctx = tenant.ctx;
}, 120_000);

afterAll(async () => {
  await world.stop();
});

describe('dailyTickSeed', () => {
  it('registers the daily-tick scenario', async () => {
    await dailyTickSeed.run({ tenantId, ctx });

    const scenarios = await listScenarios(ctx);
    expect(scenarios.some((one) => one.code === 'daily-tick' && one.kind === 'daily_tick')).toBe(true);
  });

  it('is idempotent by its code, not by adding a second row', async () => {
    await dailyTickSeed.run({ tenantId, ctx });
    await dailyTickSeed.run({ tenantId, ctx });

    const scenarios = await listScenarios(ctx);
    expect(scenarios.filter((one) => one.code === 'daily-tick')).toHaveLength(1);
  });
});
