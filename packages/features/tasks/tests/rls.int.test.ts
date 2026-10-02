import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { withTenant } from '../../../kernel/src/db/index';
import { newRowId } from '../../../kernel/src/ids/index';
import { task, taskActivity } from '../schema';
import { startTasksDb, withTestTenant, type TestDatabase, type TestTenant } from './tasks.fixture';

let database: TestDatabase;
let first: TestTenant;
let second: TestTenant;

beforeAll(async () => {
  database = await startTasksDb();
  first = await withTestTenant('A');
  second = await withTestTenant('B');
}, 120_000);

afterAll(async () => {
  await database.stop();
});

const MARK = 'značka prvního správce';
const MARK_TASK = newRowId();

interface Isolation {
  readonly name: string;
  insert(tenant: TestTenant, tenantId: string): Promise<void>;
  count(tenant: TestTenant): Promise<number>;
}

const TABLES: readonly Isolation[] = [
  {
    name: 'task',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx.insert(task).values({
          id: newRowId(),
          tenantId,
          title: MARK,
          status: 'open',
          priority: 'normal',
          departmentId: newRowId(),
        });
      }),
    count: (tenant) =>
      withTenant(tenant.ctx, async (tx) => (await tx.select().from(task).where(eq(task.title, MARK))).length),
  },
  {
    name: 'taskActivity',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx.insert(taskActivity).values({
          id: newRowId(),
          tenantId,
          taskId: MARK_TASK,
          kind: 'comment',
          body: MARK,
          actorType: 'system',
        });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) => (await tx.select().from(taskActivity).where(eq(taskActivity.taskId, MARK_TASK))).length,
      ),
  },
];

describe.each(TABLES)('$name isolation', (table) => {
  it('hides rows of another tenant', async () => {
    await table.insert(first, first.tenantId);

    expect(await table.count(second)).toBe(0);
    expect(await table.count(first)).toBeGreaterThan(0);
  });

  it('rejects a write carrying a foreign tenant_id', async () => {
    await expect(table.insert(first, second.tenantId)).rejects.toThrow();
  });
});
