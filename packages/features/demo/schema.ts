import { jsonb, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenantTable } from '../../kernel/src/db/index';

/**
 * A thing the demo can be made to do on purpose. It is tenant-scoped rather than SVJ-scoped: a
 * scenario is about showing the platform to somebody, and the person doing the showing works for
 * the management company, not for one house (task 019).
 *
 * `payload` is untyped here and parsed by the service that runs the kind: a scenario for the bank
 * generator (021) carries something else entirely, and this table should not have to know.
 */
export const demoScenario = tenantTable(
  'demo_scenario',
  {
    code: text('code').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    kind: text('kind').notNull(),
    payload: jsonb('payload').notNull(),
  },
  (table) => [uniqueIndex('demo_scenario_code_unique').on(table.tenantId, table.code)],
);
