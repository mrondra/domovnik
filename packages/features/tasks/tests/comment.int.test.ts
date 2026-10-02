import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NotFoundError } from '../../../kernel/src/errors/index';
import { commentTask } from '../service/comment';
import { createTask } from '../service/create';
import { auditsNamed, personIn, rowsOf, seedWorld, type World } from './mutations.fixture';
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

describe('commentTask', () => {
  it('adds a comment with audit and activity, and no event', async () => {
    const { ctx } = world.tenant;
    const target = await fresh();
    const audits = await auditsNamed(ctx, 'ops.task.commented');

    await commentTask(ctx, target.id, 'Volal jsem dodavateli');

    expect(await auditsNamed(ctx, 'ops.task.commented')).toBe(audits + 1);
    const comment = (await rowsOf(ctx)).activity.find(
      (one) => one.taskId === target.id && one.kind === 'comment',
    );
    expect(comment).toMatchObject({
      body: 'Volal jsem dodavateli',
      actorType: 'user',
      actorId: world.tenant.adminId,
    });
  });

  it('answers not found for a task the actor cannot reach', async () => {
    const hidden = await fresh(world.svjB);
    const chairOfA = await personIn(world.tenant, 'committee', world.svjA);

    await expect(commentTask(chairOfA, hidden.id, 'x')).rejects.toBeInstanceOf(NotFoundError);
  });
});
