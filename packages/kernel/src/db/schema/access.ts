import { jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tenantTable } from '../table';

export const session = tenantTable('session', {
  userId: uuid('user_id').notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
});

export const apiToken = tenantTable('api_token', {
  name: text('name').notNull(),
  ownerUserId: uuid('owner_user_id').notNull(),
  tokenHash: text('token_hash').notNull(),
  allowedTools: jsonb('allowed_tools').notNull().$type<readonly string[]>(),
  svjScope: jsonb('svj_scope').$type<readonly string[] | null>(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});
