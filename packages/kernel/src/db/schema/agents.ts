import { boolean, integer, jsonb, numeric, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { Role } from '../../identity/roles';
import { tenantTable } from '../table';
import { agentRunStatusEnum, agentSourceEnum, autonomyEnum } from './enums';

export const agentIdentity = tenantTable('agent_identity', {
  agentName: text('agent_name').notNull(),
  version: text('version').notNull(),
  roles: jsonb('roles').notNull().$type<readonly Role[]>(),
  isActive: boolean('is_active').notNull().default(true),
});

export const agentDefinition = tenantTable(
  'agent_definition',
  {
    name: text('name').notNull(),
    version: text('version').notNull(),
    source: agentSourceEnum('source').notNull(),
    definition: jsonb('definition').notNull(),
    prompt: text('prompt').notNull(),
    isActive: boolean('is_active').notNull().default(true),
  },
  (table) => [uniqueIndex('agent_definition_version_unique').on(table.tenantId, table.name, table.version)],
);

export const agentConfig = tenantTable('agent_config', {
  agentName: text('agent_name').notNull(),
  svjId: uuid('svj_id'),
  autonomy: autonomyEnum('autonomy'),
  model: text('model'),
  isEnabled: boolean('is_enabled').notNull().default(true),
});

export const agentRun = tenantTable('agent_run', {
  agentDefinitionId: uuid('agent_definition_id').notNull(),
  agentIdentityId: uuid('agent_identity_id').notNull(),
  svjId: uuid('svj_id'),
  triggerEventId: uuid('trigger_event_id'),
  trigger: jsonb('trigger').notNull(),
  status: agentRunStatusEnum('status').notNull(),
  traceId: text('trace_id'),
  result: jsonb('result'),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  costUsd: numeric('cost_usd', { precision: 12, scale: 6 }).notNull().default('0'),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
});
