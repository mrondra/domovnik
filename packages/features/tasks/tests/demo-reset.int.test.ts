import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTask } from '../service/create';
import { commentTask } from '../service/comment';
import { demoReset } from '../service/demo-reset';
import { rowsOf, seedWorld, type World } from './mutations.fixture';
import { startTasksDb, type TestDatabase } from './tasks.fixture';

let database: TestDatabase;
let world: World;

beforeAll(async () => {
  database = await startTasksDb();
  world = await seedWorld();
}, 120_000);

afterAll(async () => {
  await database.stop();
});

describe('the demo reset', () => {
  it('removes every task with its history and says how many', async () => {
    const { ctx } = world.tenant;
    await createTask(ctx, {
      title: 'Z faktury',
      priority: 'normal',
      departmentCode: 'finance',
      origin: { type: 'invoice', id: '019a0000-0000-7000-8000-0000000000e1' },
    });
    const byHand = await createTask(ctx, { title: 'Ručně', priority: 'low', departmentCode: 'finance' });
    await commentTask(ctx, byHand.task.id, 'Poznámka');

    const removed = await demoReset(ctx);

    expect(removed).toBe(2);
    expect(await rowsOf(ctx)).toEqual({ tasks: [], activity: [] });
  });

  it('removes nothing the second time', async () => {
    expect(await demoReset(world.tenant.ctx)).toBe(0);
  });
});
