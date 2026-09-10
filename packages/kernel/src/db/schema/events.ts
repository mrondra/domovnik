import { integer, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tenantTable } from '../table';
import { actorTypeEnum, outboxStatusEnum } from './enums';

export const event = tenantTable('event', {
  name: text('name').notNull(),
  version: integer('version').notNull(),
  payload: jsonb('payload').notNull(),
  actorType: actorTypeEnum('actor_type').notNull(),
  actorId: uuid('actor_id'),
  correlationId: text('correlation_id').notNull(),
  svjId: uuid('svj_id'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
});

export const eventOutbox = tenantTable('event_outbox', {
  eventId: uuid('event_id').notNull(),
  name: text('name').notNull(),
  status: outboxStatusEnum('status').notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  lastError: text('last_error'),
});
