import { and, eq, inArray } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { OPEN_STATUSES } from '../domain/status';
import type { CloseTasksOutcome, Task, TaskOrigin } from '../domain/types';
import { task } from '../schema';
import { taskScope, visibleTo } from './reach';
import { toTask } from './rows';
import { applyStatus } from './status';

/**
 * What a subscriber calls when the cause of tasks is gone (the invoice was paid, the defect fixed):
 * it closes the tasks still open for that origin and leaves finished ones alone. Returns the tasks
 * it closed, so a caller can tell "nothing to do" from "done".
 */
export const closeTasksForOrigin = (
  ctx: RequestContext,
  origin: TaskOrigin,
  outcome: CloseTasksOutcome,
): Promise<readonly Task[]> =>
  withTenant(ctx, async (tx) => {
    const open = await tx
      .select()
      .from(task)
      .where(
        and(
          eq(task.originType, origin.type),
          eq(task.originId, origin.id),
          inArray(task.status, [...OPEN_STATUSES]),
          visibleTo(await taskScope(ctx)),
        ),
      );

    const closed: Task[] = [];
    for (const before of open) {
      closed.push(toTask(await applyStatus(ctx, tx, before, outcome.status, outcome.note)));
    }
    return closed;
  });
