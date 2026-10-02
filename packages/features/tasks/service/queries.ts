import { and, asc, desc, eq, inArray, lt, sql } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { OPEN_STATUSES } from '../domain/status';
import type { ListTasksFilter, Task, TaskWithActivity } from '../domain/types';
import { task, taskActivity } from '../schema';
import { loadReachable, taskScope, visibleTo } from './reach';
import { toActivity, toTask, todayIso } from './rows';

/** One task with its history, oldest line first. A task out of reach answers `NotFoundError`. */
export const getTask = (ctx: RequestContext, id: string): Promise<TaskWithActivity> =>
  withTenant(ctx, async (tx) => {
    const row = await loadReachable(ctx, tx, id);
    const lines = await tx
      .select()
      .from(taskActivity)
      .where(eq(taskActivity.taskId, row.id))
      .orderBy(asc(taskActivity.createdAt), asc(taskActivity.id));
    return { ...toTask(row), activity: lines.map(toActivity) };
  });

/**
 * Tasks the actor may see, narrowed by the filter, most urgent due date first. `overdueOnly` is the
 * same test `Task.overdue` makes on every read — past `due_on` and still open — so the filter and the
 * flag cannot disagree.
 */
export const listTasks = (ctx: RequestContext, filter: ListTasksFilter = {}): Promise<readonly Task[]> =>
  withTenant(ctx, async (tx) => {
    const today = todayIso();
    const rows = await tx
      .select()
      .from(task)
      .where(
        and(
          visibleTo(await taskScope(ctx)),
          filter.departmentId === undefined ? undefined : eq(task.departmentId, filter.departmentId),
          filter.assigneeId === undefined ? undefined : eq(task.assigneeId, filter.assigneeId),
          filter.svjId === undefined ? undefined : eq(task.svjId, filter.svjId),
          filter.originType === undefined ? undefined : eq(task.originType, filter.originType),
          filter.status === undefined || filter.status.length === 0
            ? undefined
            : inArray(task.status, [...filter.status]),
          filter.overdueOnly === true
            ? and(lt(task.dueOn, today), inArray(task.status, [...OPEN_STATUSES]))
            : undefined,
        ),
      )
      .orderBy(sql`${task.dueOn} asc nulls last`, desc(task.createdAt), asc(task.id));
    return rows.map((row) => toTask(row, today));
  });
