import { eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant, type TenantTransaction } from '../../../kernel/src/db/index';
import { taskStatusChanged } from '../domain/events';
import { CLOSING_STATUSES, assertTransition } from '../domain/status';
import type { Task, TaskStatus } from '../domain/types';
import { task } from '../schema';
import { emitFor, recordActivity } from './activity';
import { loadReachable, taskNotFound } from './reach';
import { toTask, type TaskRow } from './rows';

/**
 * Moves one already-loaded task and leaves audit, activity and event behind. Shared with
 * `closeTasksForOrigin`, so closing by origin is not a second way to change a status.
 */
export const applyStatus = async (
  ctx: RequestContext,
  tx: TenantTransaction,
  before: TaskRow,
  to: TaskStatus,
  note: string | undefined,
): Promise<TaskRow> => {
  assertTransition(before.status, to);

  const rows = await tx
    .update(task)
    .set({ status: to, closedAt: CLOSING_STATUSES.includes(to) ? new Date() : null, updatedAt: new Date() })
    .where(eq(task.id, before.id))
    .returning();
  const row = rows[0];
  if (row === undefined) throw taskNotFound(before.id);

  await audit.record(ctx, {
    action: 'ops.task.status_changed',
    entity: 'task',
    entityId: row.id,
    reason: note ?? 'Změna stavu úkolu',
    before: { status: before.status },
    after: { status: row.status },
  });
  await recordActivity(ctx, tx, {
    taskId: row.id,
    kind: 'status_changed',
    body: note,
    data: { from: before.status, to },
  });
  await emitFor(ctx, row.svjId, taskStatusChanged.create({ taskId: row.id, from: before.status, to }));
  return row;
};

/** `closed_at` is set by `done` and `cancelled` and cleared again when the task is reopened. */
export const changeStatus = (
  ctx: RequestContext,
  taskId: string,
  to: TaskStatus,
  note?: string,
): Promise<Task> =>
  withTenant(ctx, async (tx) => {
    const before = await loadReachable(ctx, tx, taskId);
    return toTask(await applyStatus(ctx, tx, before, to, note));
  });
