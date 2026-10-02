import { sql } from 'drizzle-orm';
import { date, index, jsonb, pgEnum, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { tenantTable } from '../../kernel/src/db/index';
import { actorTypeEnum } from '../../kernel/src/db/schema/enums';

export const taskStatusEnum = pgEnum('task_status', ['open', 'in_progress', 'waiting', 'done', 'cancelled']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'normal', 'high', 'urgent']);
export const taskActivityKindEnum = pgEnum('task_activity_kind', [
  'comment',
  'status_changed',
  'assigned',
  'created',
]);

/**
 * A task belongs to a department, not necessarily to an SVJ (a company car's inspection has none),
 * so it is tenant-scoped and `svj_id` is nullable. `dedupe_key` lets a subscriber raise the same
 * task twice without creating it twice; `overdue` is never stored, it is derived from `due_on`.
 */
export const task = tenantTable(
  'task',
  {
    svjId: uuid('svj_id'),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    status: taskStatusEnum('status').notNull(),
    priority: taskPriorityEnum('priority').notNull(),
    departmentId: uuid('department_id').notNull(),
    assigneeId: uuid('assignee_id'),
    dueOn: date('due_on'),
    originType: text('origin_type'),
    originId: uuid('origin_id'),
    dedupeKey: text('dedupe_key'),
    createdByAgentRunId: uuid('created_by_agent_run_id'),
    closedAt: timestamp('closed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('task_dedupe_key_unique')
      .on(table.tenantId, table.dedupeKey)
      .where(sql`${table.dedupeKey} is not null`),
    index('task_department_status_idx').on(table.tenantId, table.departmentId, table.status),
    index('task_assignee_status_idx').on(table.tenantId, table.assigneeId, table.status),
    index('task_svj_status_idx').on(table.tenantId, table.svjId, table.status),
    index('task_origin_idx').on(table.tenantId, table.originType, table.originId),
  ],
);

export const taskActivity = tenantTable(
  'task_activity',
  {
    taskId: uuid('task_id').notNull(),
    kind: taskActivityKindEnum('kind').notNull(),
    body: text('body'),
    data: jsonb('data'),
    actorType: actorTypeEnum('actor_type').notNull(),
    actorId: uuid('actor_id'),
  },
  (table) => [index('task_activity_task_idx').on(table.tenantId, table.taskId, table.createdAt)],
);
