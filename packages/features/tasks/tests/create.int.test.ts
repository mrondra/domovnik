import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NotFoundError } from '../../../kernel/src/errors/index';
import { createTask } from '../service/create';
import { auditsNamed, eventsNamed, personIn, rowsOf, seedWorld, type World } from './mutations.fixture';
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

describe('createTask', () => {
  it('opens a task in the department found by code, with audit, activity and event', async () => {
    const { ctx } = world.tenant;
    const { task, created } = await createTask(ctx, {
      svjId: world.svjA,
      title: 'Výměna žárovek',
      priority: 'high',
      departmentCode: 'finance',
      dueOn: '2030-01-01',
    });

    expect(created).toBe(true);
    expect(task).toMatchObject({
      status: 'open',
      departmentId: world.departmentId,
      svjId: world.svjA,
      overdue: false,
    });
    expect(await auditsNamed(ctx, 'ops.task.created')).toBe(1);
    expect(await eventsNamed(ctx, 'ops.task.created')).toBe(1);
    const stored = await rowsOf(ctx);
    expect(stored.activity.filter((one) => one.taskId === task.id).map((one) => one.kind)).toEqual([
      'created',
    ]);
  });

  it('takes a department id as well, and a task without an SVJ', async () => {
    const { task } = await createTask(world.tenant.ctx, {
      title: 'STK auta',
      priority: 'normal',
      departmentId: world.departmentId,
    });

    expect(task.svjId).toBeNull();
    expect(task.departmentId).toBe(world.departmentId);
  });

  it('answers the existing task for a repeated dedupeKey without a second row or event', async () => {
    const { ctx } = world.tenant;
    const input = {
      title: 'Faktura po splatnosti',
      priority: 'normal',
      departmentCode: 'finance',
      dedupeKey: 'invoice-overdue:1',
    } as const;
    const events = await eventsNamed(ctx, 'ops.task.created');

    const first = await createTask(ctx, input);
    const second = await createTask(ctx, { ...input, title: 'Jiný název' });

    expect([first.created, second.created]).toEqual([true, false]);
    expect(second.task.id).toBe(first.task.id);
    expect(second.task.title).toBe('Faktura po splatnosti');
    expect(await eventsNamed(ctx, 'ops.task.created')).toBe(events + 1);
    expect((await rowsOf(ctx)).tasks.filter((one) => one.dedupeKey === input.dedupeKey)).toHaveLength(1);
  });

  it('survives two callers racing on one dedupeKey', async () => {
    const input = {
      title: 'Souběh',
      priority: 'low',
      departmentCode: 'finance',
      dedupeKey: 'race:1',
    } as const;

    const both = await Promise.all([
      createTask(world.tenant.ctx, input),
      createTask(world.tenant.ctx, input),
    ]);

    expect(both.map((one) => one.created).sort()).toEqual([false, true]);
    expect(both[0].task.id).toBe(both[1].task.id);
  });

  it('refuses an unknown department code', async () => {
    await expect(
      createTask(world.tenant.ctx, { title: 'x', priority: 'low', departmentCode: 'neexistuje' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('refuses to open a task in an SVJ the actor cannot reach', async () => {
    const chairOfA = await personIn(world.tenant, 'committee', world.svjA);

    await expect(
      createTask(chairOfA, { svjId: world.svjB, title: 'x', priority: 'low', departmentCode: 'finance' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
