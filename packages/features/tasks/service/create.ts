import { eq, sql } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { newRowId } from '../../../kernel/src/ids/index';
import { departmentByCode } from '../../svj/index';
import { taskCreated } from '../domain/events';
import type { CreateTaskInput, Task } from '../domain/types';
import { task } from '../schema';
import { emitFor, recordActivity } from './activity';
import { isVisible, taskNotFound, taskScope } from './reach';
import { toTask } from './rows';

/**
 * A `dedupeKey` that already names a task answers that task with `created: false` and emits
 * nothing, so a subscriber that fires twice for one cause raises one task. `ON CONFLICT` carries the
 * partial index's predicate: without it Postgres does not match the index and a race between two
 * callers would end in a unique violation instead of the existing task.
 */
export const createTask = (
  ctx: RequestContext,
  input: CreateTaskInput,
): Promise<{ readonly task: Task; readonly created: boolean }> =>
  withTenant(ctx, async (tx) => {
    const scope = await taskScope(ctx);
    if (input.svjId !== undefined && !isVisible(scope, input.svjId)) throw taskNotFound(input.svjId);

    const departmentId = input.departmentId ?? (await departmentByCode(ctx, input.departmentCode)).id;
    const id = newRowId();

    const inserted = await tx
      .insert(task)
      .values({
        id,
        tenantId: ctx.tenantId,
        createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
        svjId: input.svjId ?? null,
        title: input.title,
        description: input.description ?? '',
        status: 'open',
        priority: input.priority,
        departmentId,
        assigneeId: input.assigneeId ?? null,
        dueOn: input.dueOn ?? null,
        originType: input.origin?.type ?? null,
        originId: input.origin?.id ?? null,
        dedupeKey: input.dedupeKey ?? null,
        createdByAgentRunId: ctx.agentRunId ?? null,
      })
      .onConflictDoNothing({
        target: [task.tenantId, task.dedupeKey],
        where: sql`${task.dedupeKey} is not null`,
      })
      .returning();

    const row = inserted[0];
    if (row === undefined) {
      const existing = await tx
        .select()
        .from(task)
        .where(eq(task.dedupeKey, input.dedupeKey ?? ''))
        .limit(1);
      const found = existing[0];
      if (found === undefined || !isVisible(scope, found.svjId)) throw taskNotFound(input.dedupeKey ?? '');
      return { task: toTask(found), created: false };
    }

    await audit.record(ctx, {
      action: 'ops.task.created',
      entity: 'task',
      entityId: row.id,
      reason: 'Založen úkol',
      after: {
        title: row.title,
        priority: row.priority,
        departmentId: row.departmentId,
        svjId: row.svjId,
        assigneeId: row.assigneeId,
      },
    });
    await recordActivity(ctx, tx, {
      taskId: row.id,
      kind: 'created',
      data: { priority: row.priority, origin: input.origin ?? null },
    });
    await emitFor(
      ctx,
      row.svjId,
      taskCreated.create({
        taskId: row.id,
        svjId: row.svjId,
        departmentId: row.departmentId,
        priority: row.priority,
        originType: row.originType,
        originId: row.originId,
      }),
    );

    return { task: toTask(row), created: true };
  });
