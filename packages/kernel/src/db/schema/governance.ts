import { jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tenantTable } from '../table';
import { actorTypeEnum, approvalStatusEnum } from './enums';

export const approval = tenantTable('approval', {
  toolName: text('tool_name').notNull(),
  input: jsonb('input').notNull(),
  evidence: jsonb('evidence').notNull(),
  approvers: jsonb('approvers').notNull().$type<readonly string[]>(),
  deadline: timestamp('deadline', { withTimezone: true }),
  status: approvalStatusEnum('status').notNull().default('pending'),
  svjId: uuid('svj_id'),
  agentRunId: uuid('agent_run_id'),
  decidedBy: uuid('decided_by'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  comment: text('comment'),
  result: jsonb('result'),
  /** Set once the deferred handler has run; the resume subscriber's idempotency key (ADR 0015). */
  executedAt: timestamp('executed_at', { withTimezone: true }),
});

export const auditLog = tenantTable('audit_log', {
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: uuid('entity_id'),
  reason: text('reason').notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  actorType: actorTypeEnum('actor_type').notNull(),
  actorId: uuid('actor_id'),
  correlationId: text('correlation_id').notNull(),
  agentRunId: uuid('agent_run_id'),
  /** How the actor reached the system when it was not the web session, e.g. `api_token:<id>`. */
  via: text('via'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
});
