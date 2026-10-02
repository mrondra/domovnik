import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { userIdSchema } from '../../../kernel/src/ids/index';
import { createTask } from '../service/create';
import { getTask, listTasks } from '../service/queries';
import { changeStatus } from '../service/status';
import { personIn, seedWorld, type World } from './mutations.fixture';
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

describe('getTask', () => {
  it('returns the history oldest line first', async () => {
    const { ctx } = world.tenant;
    const { task } = await createTask(ctx, {
      title: 'S historií',
      priority: 'high',
      departmentCode: 'finance',
    });
    await changeStatus(ctx, task.id, 'in_progress', 'Začínáme');

    const found = await getTask(ctx, task.id);

    expect(found.activity.map((line) => line.kind)).toEqual(['created', 'status_changed']);
    expect(found.activity[1]).toMatchObject({ body: 'Začínáme', data: { from: 'open', to: 'in_progress' } });
  });
});

describe('listTasks', () => {
  it('keeps only open tasks past their due date when asked for overdueOnly', async () => {
    const { ctx } = world.tenant;
    const raise = async (title: string, dueOn: string): Promise<string> =>
      (
        await createTask(ctx, {
          title,
          priority: 'normal',
          departmentCode: 'finance',
          dueOn,
          svjId: world.svjA,
        })
      ).task.id;
    const late = await raise('Po termínu', '2000-01-01');
    const lateButDone = await raise('Po termínu, hotovo', '2000-01-01');
    await changeStatus(ctx, lateButDone, 'done');
    const future = await raise('V termínu', '2999-01-01');

    const overdue = await listTasks(ctx, { overdueOnly: true, svjId: world.svjA });

    expect(overdue.map((one) => one.id)).toEqual([late]);
    expect(overdue[0]?.overdue).toBe(true);
    const all = await listTasks(ctx, { svjId: world.svjA });
    expect(all.find((one) => one.id === lateButDone)?.overdue).toBe(false);
    expect(all.find((one) => one.id === future)?.overdue).toBe(false);
  });

  it('filters by status, assignee and origin type', async () => {
    const { ctx } = world.tenant;
    const worker = await personIn(world.tenant, 'technician');
    const origin = { type: 'defect', id: '019a0000-0000-7000-8000-0000000000d1' };
    const { task } = await createTask(ctx, {
      title: 'Ze závady',
      priority: 'urgent',
      departmentCode: 'finance',
      assigneeId: userIdSchema.parse(worker.actor.id),
      origin,
    });
    await changeStatus(ctx, task.id, 'waiting');

    const byOrigin = await listTasks(ctx, { originType: 'defect', status: ['waiting'] });
    const byAssignee = await listTasks(ctx, {
      assigneeId: userIdSchema.parse(worker.actor.id),
      status: ['open'],
    });

    expect(byOrigin.map((one) => one.id)).toEqual([task.id]);
    expect(byAssignee).toEqual([]);
  });
});
