import { eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import type { UserId } from '../../../kernel/src/ids/index';
import { taskAssigned } from '../domain/events';
import type { Task } from '../domain/types';
import { task } from '../schema';
import { emitFor, recordActivity } from './activity';
import { loadReachable, taskNotFound } from './reach';
import { toTask } from './rows';

/** `null` takes the task back from whoever had it. */
export const assignTask = (ctx: RequestContext, taskId: string, assigneeId: UserId | null): Promise<Task> =>
  withTenant(ctx, async (tx) => {
    const before = await loadReachable(ctx, tx, taskId);

    const rows = await tx
      .update(task)
      .set({ assigneeId, updatedAt: new Date() })
      .where(eq(task.id, taskId))
      .returning();
    const row = rows[0];
    if (row === undefined) throw taskNotFound(taskId);

    await audit.record(ctx, {
      action: 'ops.task.assigned',
      entity: 'task',
      entityId: row.id,
      reason: assigneeId === null ? 'Úkol zbaven řešitele' : 'Úkol přiřazen',
      before: { assigneeId: before.assigneeId },
      after: { assigneeId: row.assigneeId },
    });
    await recordActivity(ctx, tx, {
      taskId: row.id,
      kind: 'assigned',
      data: { from: before.assigneeId, to: row.assigneeId },
    });
    await emitFor(ctx, row.svjId, taskAssigned.create({ taskId: row.id, assigneeId: row.assigneeId }));

    return toTask(row);
  });
