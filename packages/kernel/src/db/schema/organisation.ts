import { boolean, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { Role } from '../../identity/roles';
import { tenantTable } from '../table';

export const tenant = tenantTable('tenant', {
  name: text('name').notNull(),
  ico: text('ico'),
  isActive: boolean('is_active').notNull().default(true),
});

export const user = tenantTable(
  'user',
  {
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    passwordHash: text('password_hash').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  },
  (table) => [uniqueIndex('user_email_unique').on(table.tenantId, table.email)],
);

export const userRole = tenantTable('user_role', {
  userId: uuid('user_id').notNull(),
  role: text('role').notNull().$type<Role>(),
  svjId: uuid('svj_id'),
});
