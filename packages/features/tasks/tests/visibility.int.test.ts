import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createContext, type RequestContext } from '../../../kernel/src/context/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { createTask } from '../service/create';
import { getTask, listTasks } from '../service/queries';
import { changeStatus } from '../service/status';
import { personIn, seedWorld, type World } from './mutations.fixture';
import { startTasksDb, type TestDatabase } from './tasks.fixture';

let database: TestDatabase;
let world: World;
let inA: string;
let inB: string;
let noSvj: string;

beforeAll(async () => {
  database = await startTasksDb();
  world = await seedWorld();
  const raise = async (title: string, svjId?: SvjId): Promise<string> =>
    (
      await createTask(world.tenant.ctx, {
        title,
        priority: 'normal',
        departmentCode: 'finance',
        ...(svjId === undefined ? {} : { svjId }),
      })
    ).task.id;
  inA = await raise('Úkol A', world.svjA);
  inB = await raise('Úkol B', world.svjB);
  noSvj = await raise('STK auta');
}, 120_000);

afterAll(async () => {
  await database.stop();
});

const idsOf = async (ctx: RequestContext): Promise<string[]> =>
  (await listTasks(ctx)).map((one) => one.id).sort();

describe('who sees which task', () => {
  it('shows a technician every task of the tenant, including one without an SVJ', async () => {
    const technician = await personIn(world.tenant, 'technician');

    expect(await idsOf(technician)).toEqual([inA, inB, noSvj].sort());
    expect((await getTask(technician, noSvj)).title).toBe('STK auta');
  });

  it('shows a committee member only the tasks of their SVJ', async () => {
    const committee = await personIn(world.tenant, 'committee', world.svjA);

    expect(await idsOf(committee)).toEqual([inA]);
    expect((await getTask(committee, inA)).id).toBe(inA);
    await expect(getTask(committee, inB)).rejects.toBeInstanceOf(NotFoundError);
    await expect(getTask(committee, noSvj)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('shows a credential with an svjScope only tasks of those SVJ, never one without an SVJ', async () => {
    const technician = await personIn(world.tenant, 'technician');
    const token = createContext({
      tenantId: world.tenant.tenantId,
      actor: technician.actor,
      svjScope: [world.svjB],
    });

    expect(await idsOf(token)).toEqual([inB]);
    await expect(getTask(token, noSvj)).rejects.toBeInstanceOf(NotFoundError);
    await expect(getTask(token, inA)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('answers a mutation on an unreachable task like one that does not exist', async () => {
    const committee = await personIn(world.tenant, 'committee', world.svjA);

    await expect(changeStatus(committee, inB, 'done')).rejects.toBeInstanceOf(NotFoundError);
  });
});
