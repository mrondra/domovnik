import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { newRowId } from '../../../kernel/src/ids/index';
import { SvjService } from '../../svj/index';
import { listTasks } from '../../tasks/index';
import { syncConflictIdSchema } from '../domain/ids';
import { syncConflictDetected, syncConflictResolved } from '../domain/events';
import { resolveConflict } from '../service/index';
import { openConflict } from '../service/conflicts';
import { closeConflictTask } from '../subscribers/close-conflict-task';
import { raiseConflictTasks } from '../subscribers/conflict-tasks';
import { startComposedDb, withTestTenant, type TestDatabase } from './accounting.fixture';
import { deliver, linkedHouse, type LinkedHouse } from './flow.fixture';

let database: TestDatabase;
let ctx: RequestContext;
let house: LinkedHouse;
let ids: readonly string[];

const open = async (field: string): Promise<string> => {
  const id = await openConflict(ctx, {
    svjId: house.svjId,
    entityType: 'invoice',
    entityId: newRowId(),
    field,
    ours: 100,
    theirs: 90,
  });
  if (id === null) throw new RangeError('conflict');
  return id;
};

const tasks = () => listTasks(ctx, {});

beforeAll(async () => {
  database = await startComposedDb();
  ctx = (await withTestTenant()).ctx;
  await new SvjService().createDepartment(ctx, { code: 'finance', name: 'Finance' });
  house = await linkedHouse(ctx);
  ids = [await open('amountTotal'), await open('dueOn')];
}, 300_000);

afterAll(async () => {
  await database.stop();
});

const detected = () =>
  deliver(ctx, raiseConflictTasks.handler, {
    name: syncConflictDetected.name,
    version: syncConflictDetected.version,
    payload: { svjId: house.svjId, conflictIds: ids },
  });

describe('tasks for sync conflicts', () => {
  it('raises one task per conflict, however often the batch is delivered', async () => {
    await detected();
    await detected();

    const found = await tasks();
    expect(found).toHaveLength(2);
    expect(found.map((t) => t.priority)).toStrictEqual(['high', 'high']);
    expect(found[0]?.description).toContain('Hodnota v Pohodě: 90');
  });

  it('close-conflict-task closes only the task of the resolved conflict', async () => {
    const [first] = ids;
    if (first === undefined) throw new RangeError('ids');
    await resolveConflict(ctx, {
      conflictId: syncConflictIdSchema.parse(first),
      resolution: 'take_theirs',
      note: 'Opraveno.',
    });

    const event = {
      name: syncConflictResolved.name,
      version: syncConflictResolved.version,
      payload: { svjId: house.svjId, conflictId: first, resolution: 'take_theirs' },
    };
    await deliver(ctx, closeConflictTask.handler, event);
    await deliver(ctx, closeConflictTask.handler, event);

    const statuses = (await tasks()).map((t) => t.status).sort();
    expect(statuses).toStrictEqual(['done', 'open']);
  });
});
