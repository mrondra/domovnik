import type { InferSelectModel } from 'drizzle-orm';
import { svjIdSchema, userIdSchema } from '../../../kernel/src/ids/index';
import { OPEN_STATUSES } from '../domain/status';
import { taskIdSchema } from '../domain/ids';
import type { Task, TaskActivity } from '../domain/types';
import type { task, taskActivity } from '../schema';

export type TaskRow = InferSelectModel<typeof task>;
export type ActivityRow = InferSelectModel<typeof taskActivity>;

/** Today as an ISO date, the form `due_on` has; `overdue` is compared against it on every read. */
export const todayIso = (): string => new Date().toISOString().slice(0, 10);

const isOverdue = (row: TaskRow, today: string): boolean =>
  row.dueOn !== null && row.dueOn < today && OPEN_STATUSES.includes(row.status);

export const toTask = (row: TaskRow, today: string = todayIso()): Task => ({
  id: taskIdSchema.parse(row.id),
  svjId: row.svjId === null ? null : svjIdSchema.parse(row.svjId),
  title: row.title,
  description: row.description,
  status: row.status,
  priority: row.priority,
  departmentId: row.departmentId,
  assigneeId: row.assigneeId === null ? null : userIdSchema.parse(row.assigneeId),
  dueOn: row.dueOn,
  origin:
    row.originType === null || row.originId === null ? null : { type: row.originType, id: row.originId },
  dedupeKey: row.dedupeKey,
  createdByAgentRunId: row.createdByAgentRunId,
  closedAt: row.closedAt,
  createdAt: row.createdAt,
  overdue: isOverdue(row, today),
});

export const toActivity = (row: ActivityRow): TaskActivity => ({
  id: row.id,
  taskId: taskIdSchema.parse(row.taskId),
  kind: row.kind,
  body: row.body,
  data: row.data,
  actorType: row.actorType,
  actorId: row.actorId,
  createdAt: row.createdAt,
});
