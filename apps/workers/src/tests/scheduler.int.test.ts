import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { clearAgents } from '../../../../packages/kernel/src/agents/index';
import { event as eventTable } from '../../../../packages/kernel/src/db/schema/index';
import { withTenant } from '../../../../packages/kernel/src/db/index';
import { dailyTick, monthlyTick } from '../../../../packages/kernel/src/events/index';
import {
  startTestDb,
  withTestTenant,
  type TestDatabase,
  type TestTenant,
} from '../../../../packages/kernel/src/testing/index';
import { startScheduler } from '../runtime/scheduler';
import { recordingCronQueue } from './cron.fixture';

let database: TestDatabase;
let first: TestTenant;
let second: TestTenant;

beforeAll(async () => {
  database = await startTestDb();
  first = await withTestTenant('První správce');
  second = await withTestTenant('Druhý správce');
  clearAgents();
}, 180_000);

afterAll(async () => {
  await database.stop();
});

const ticksOf = (tenant: TestTenant, name: string) =>
  withTenant(tenant.ctx, (tx) => tx.select().from(eventTable).where(eq(eventTable.name, name)));

const noRun = () => Promise.resolve();

describe('the scheduler', () => {
  it('registers a cron for each tick', async () => {
    const queue = recordingCronQueue();

    const names = await startScheduler(queue, noRun);

    expect(names).toEqual([dailyTick.name, monthlyTick.name]);
    expect(queue.crons.get(dailyTick.name)).toBe('0 6 * * *');
    expect(queue.crons.get(monthlyTick.name)).toBe('0 6 1 * *');
  });

  it('emits the daily tick once for every active tenant', async () => {
    const queue = recordingCronQueue();
    await startScheduler(queue, noRun);

    await queue.fire(dailyTick.name);

    expect(await ticksOf(first, dailyTick.name)).toHaveLength(1);
    expect(await ticksOf(second, dailyTick.name)).toHaveLength(1);
  }, 60_000);

  it('carries the moment it fired in the payload', async () => {
    const queue = recordingCronQueue();
    await startScheduler(queue, noRun);

    await queue.fire(monthlyTick.name);

    const rows = await ticksOf(first, monthlyTick.name);
    expect(monthlyTick.schema.parse(rows[0]?.payload).at).toMatch(/^\d{4}-/);
  }, 60_000);
});
