import { eq, inArray, sql, type SQL } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { TenantTransaction } from '../../../kernel/src/db/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import { reachableSvj } from '../../../kernel/src/identity/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { task } from '../schema';
import type { TaskRow } from './rows';

/** `null` is every task of the tenant; a list is the SVJ the actor may see, and nothing without one. */
export type TaskScope = readonly SvjId[] | null;

/**
 * Who sees which task (ADR 0016). `reachableSvj` already intersects the actor's roles with the SVJ
 * scope of their credential. Where it narrows anything, a task without an SVJ is out of reach: it
 * belongs to no house the actor may be there for. Where it narrows nothing (`null`), everything is.
 */
export const taskScope = (ctx: RequestContext): Promise<TaskScope> => reachableSvj(ctx);

export const isVisible = (scope: TaskScope, svjId: string | null): boolean =>
  scope === null || (svjId !== null && scope.some((allowed) => allowed === svjId));

/** The same rule as a `WHERE` fragment, for queries that list. `undefined` means no narrowing. */
export const visibleTo = (scope: TaskScope): SQL | undefined => {
  if (scope === null) return undefined;
  return scope.length === 0 ? sql`false` : inArray(task.svjId, [...scope]);
};

export const taskNotFound = (taskId: string): NotFoundError =>
  new NotFoundError('Úkol nenalezen', { code: 'task_not_found', details: { taskId } });

/**
 * One task by id, the way every mutation by id starts. A task the actor may not reach answers the
 * same `NotFoundError` as one that does not exist: whether it exists is itself something they may
 * not learn.
 */
export const loadReachable = async (
  ctx: RequestContext,
  tx: TenantTransaction,
  taskId: string,
): Promise<TaskRow> => {
  const rows = await tx.select().from(task).where(eq(task.id, taskId)).limit(1);
  const found = rows[0];
  if (found === undefined || !isVisible(await taskScope(ctx), found.svjId)) throw taskNotFound(taskId);
  return found;
};
