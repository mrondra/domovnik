import { jsonb, pgEnum, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { svjTable } from '../../../kernel/src/db/index';

/** `mock` is an in-memory Pohoda the demo runs on; `mserver` talks to a real one (ADR 0005). */
export const accountingAdapterEnum = pgEnum('accounting_adapter', ['mock', 'mserver']);

export const receivablesAdapterEnum = pgEnum('receivables_adapter', ['internal', 'pohoda_other_receivables']);

/**
 * Which accounting unit an SVJ is in Pohoda, and which implementations it is served by. Every SVJ
 * is its own accounting unit there (zadání kap. 4), so this is one row per house and the place
 * both `accounting-sync` and `receivables` ask before they do anything.
 */
export const accountingLink = svjTable(
  'accounting_link',
  {
    accountingAdapter: accountingAdapterEnum('accounting_adapter').notNull(),
    receivablesAdapter: receivablesAdapterEnum('receivables_adapter').notNull(),
    companyIco: text('company_ico').notNull(),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    config: jsonb('config'),
  },
  (table) => [uniqueIndex('accounting_link_svj_unique').on(table.tenantId, table.svjId)],
);
