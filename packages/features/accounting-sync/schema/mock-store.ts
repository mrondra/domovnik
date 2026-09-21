import { jsonb, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { svjTable } from '../../../kernel/src/db/index';

/**
 * What the demo's Pohoda has been told. It is a table rather than a map in memory so a
 * demonstration survives a restart — an invoice that was posted before lunch is still posted
 * after it (task 024).
 */
export const pohodaMockStore = svjTable(
  'pohoda_mock_store',
  {
    ref: text('ref').notNull(),
    kind: text('kind').notNull(),
    xml: text('xml').notNull(),
    state: jsonb('state').notNull(),
  },
  (table) => [uniqueIndex('pohoda_mock_store_ref_unique').on(table.tenantId, table.svjId, table.ref)],
);
