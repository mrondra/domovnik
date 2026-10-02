import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closeTasksForOrigin } from '../service/close-for-origin';
import { createTask } from '../service/create';
import { changeStatus } from '../service/status';
import { eventsNamed, rowsOf, seedWorld, type World } from './mutations.fixture';
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

const ORIGIN = { type: 'invoice', id: '019a0000-0000-7000-8000-0000000000aa' } as const;
const OTHER = { type: 'invoice', id: '019a0000-0000-7000-8000-0000000000bb' } as const;

const raise = async (origin: { type: string; id: string }) =>
  (
    await createTask(world.tenant.ctx, {
      title: 'Úkol z faktury',
      priority: 'normal',
      departmentCode: 'finance',
      origin,
    })
  ).task;

describe('closeTasksForOrigin', () => {
  it('closes the open tasks of that origin and leaves finished ones and other origins alone', async () => {
    const { ctx } = world.tenant;
    const open = await raise(ORIGIN);
    const waiting = await changeStatus(ctx, (await raise(ORIGIN)).id, 'waiting');
    const done = await changeStatus(ctx, (await raise(ORIGIN)).id, 'done');
    const elsewhere = await raise(OTHER);
    const events = await eventsNamed(ctx, 'ops.task.status_changed');

    const closed = await closeTasksForOrigin(ctx, ORIGIN, { status: 'cancelled', note: 'Faktura zaplacena' });

    expect(closed.map((one) => one.id).sort()).toEqual([open.id, waiting.id].sort());
    const byId = new Map((await rowsOf(ctx)).tasks.map((one) => [one.id, one]));
    expect(byId.get(open.id)).toMatchObject({ status: 'cancelled' });
    expect(byId.get(open.id)?.closedAt).toBeInstanceOf(Date);
    expect(byId.get(waiting.id)?.status).toBe('cancelled');
    expect(byId.get(done.id)?.status).toBe('done');
    expect(byId.get(elsewhere.id)?.status).toBe('open');
    expect(await eventsNamed(ctx, 'ops.task.status_changed')).toBe(events + 2);
  });

  it('closes nothing and says so when no task is open for the origin', async () => {
    const closed = await closeTasksForOrigin(
      world.tenant.ctx,
      { type: 'invoice', id: '019a0000-0000-7000-8000-0000000000cc' },
      { status: 'done', note: 'x' },
    );

    expect(closed).toEqual([]);
  });
});
