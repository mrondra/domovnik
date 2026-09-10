import { pgEnum } from 'drizzle-orm/pg-core';

export const actorTypeEnum = pgEnum('actor_type', ['user', 'agent', 'system']);
export const agentSourceEnum = pgEnum('agent_source', ['system', 'user']);
export const autonomyEnum = pgEnum('agent_autonomy', ['read', 'propose', 'act']);
export const agentRunStatusEnum = pgEnum('agent_run_status', [
  'running',
  'succeeded',
  'failed',
  'failed_budget',
]);
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected', 'expired']);
export const outboxStatusEnum = pgEnum('outbox_status', ['pending', 'published', 'failed']);
