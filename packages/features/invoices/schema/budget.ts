import { integer, numeric, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { svjTable } from '../../../kernel/src/db/index';

const MONEY = { precision: 12, scale: 2 } as const;

/**
 * What the SVJ planned to spend in one year on one category. The plan is ours; the actual spending
 * is read from the invoices that were approved, and in the end from Pohoda (ADR 0005).
 */
export const budgetLine = svjTable(
  'budget_line',
  {
    year: integer('year').notNull(),
    category: text('category').notNull(),
    plannedAmount: numeric('planned_amount', MONEY).notNull(),
  },
  (table) => [uniqueIndex('budget_line_unique').on(table.tenantId, table.svjId, table.year, table.category)],
);
