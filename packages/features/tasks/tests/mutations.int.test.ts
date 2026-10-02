import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DomainError, NotFoundError } from '../../../kernel/src/errors/index';
import { assignTask } from '../service/assign';
import { createTask } from '../service/create';
import { changeStatus } from '../service/status';
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

const fresh = async (svjId = world.svjA) =>
  (
    await createTask(world.tenant.ctx, {
      svjId,
      title: 'Úkol',
      priority: 'normal',
      departmentCode: 'finance',
    })
  ).task;

const activityOf = async (taskId: string): Promise<readonly string[]> =>
  (await rowsOf(world.tenant.ctx)).activity.filter((one) => one.taskId === taskId).map((one) => one.kind);

describe('assignTask', () => {
  it('assigns and unassigns, leaving audit, activity and an event each time', async () => {
    const { ctx } = world.tenant;
    const target = await fresh();
    const audits = await auditsNamed(ctx, 'ops.task.assigned');
    const events = await eventsNamed(ctx, 'ops.task.assigned');

    const assigned = await assignTask(ctx, target.id, world.tenant.adminId);
    const released = await assignTask(ctx, target.id, null);

    expect(assigned.assigneeId).toBe(world.tenant.adminId);
    expect(released.assigneeId).toBeNull();
    expect(await auditsNamed(ctx, 'ops.task.assigned')).toBe(audits + 2);
    expect(await eventsNamed(ctx, 'ops.task.assigned')).toBe(events + 2);
    expect(await activityOf(target.id)).toEqual(['created', 'assigned', 'assigned']);
  });

  it('answers not found for a task of an SVJ the actor cannot reach', async () => {
    const hidden = await fresh(world.svjB);
    const chairOfA = await personIn(world.tenant, 'committee', world.svjA);

    await expect(assignTask(chairOfA, hidden.id, null)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('changeStatus', () => {
  it('stamps closed_at on done, clears it on reopening, and records each step', async () => {
    const { ctx } = world.tenant;
    const target = await fresh();
    const audits = await auditsNamed(ctx, 'ops.task.status_changed');
    const events = await eventsNamed(ctx, 'ops.task.status_changed');

    const started = await changeStatus(ctx, target.id, 'in_progress');
    const done = await changeStatus(ctx, target.id, 'done', 'Hotovo');
    const reopened = await changeStatus(ctx, target.id, 'open');

    expect(started.closedAt).toBeNull();
    expect(done.closedAt).toBeInstanceOf(Date);
    expect(reopened).toMatchObject({ status: 'open', closedAt: null });
    expect(await auditsNamed(ctx, 'ops.task.status_changed')).toBe(audits + 3);
    expect(await eventsNamed(ctx, 'ops.task.status_changed')).toBe(events + 3);
    const stored = (await rowsOf(ctx)).activity.find(
      (one) => one.taskId === target.id && one.body === 'Hotovo',
    );
    expect(stored).toMatchObject({ kind: 'status_changed', data: { from: 'in_progress', to: 'done' } });
  });

  it('refuses a step the machine does not allow and leaves nothing behind', async () => {
    const { ctx } = world.tenant;
    const target = await changeStatus(ctx, (await fresh()).id, 'done');
    const events = await eventsNamed(ctx, 'ops.task.status_changed');

    await expect(changeStatus(ctx, target.id, 'waiting')).rejects.toBeInstanceOf(DomainError);

    expect(await eventsNamed(ctx, 'ops.task.status_changed')).toBe(events);
    expect(await activityOf(target.id)).toEqual(['created', 'status_changed']);
  });

  it('answers not found for an unknown task', async () => {
    await expect(
      changeStatus(world.tenant.ctx, '019a0000-0000-7000-8000-000000000000', 'done'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
