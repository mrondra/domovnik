import { date, index, integer, numeric, pgEnum, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { svjTable } from '../../kernel/src/db/index';

/** Where the prescription came from — our own records or an import (ADR 0005). */
export const prescriptionSourceEnum = pgEnum('prescription_source', ['internal', 'pohoda']);

export const balanceEntryKindEnum = pgEnum('balance_entry_kind', ['prescription', 'payment', 'adjustment']);

const MONEY = { precision: 12, scale: 2 } as const;

/**
 * A prescription is written for a **unit**, not for an owner: who owns it changes, the unit does
 * not, and the payer is recognised by the variable symbol. Owners arrive in phase 3 without this
 * table changing (task 012).
 */
export const prescription = svjTable(
  'prescription',
  {
    unitId: uuid('unit_id').notNull(),
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    variableSymbol: text('variable_symbol').notNull(),
    totalAmount: numeric('total_amount', MONEY).notNull(),
    dueDate: date('due_date').notNull(),
    source: prescriptionSourceEnum('source').notNull(),
  },
  (table) => [
    uniqueIndex('prescription_period_unique').on(
      table.tenantId,
      table.svjId,
      table.unitId,
      table.year,
      table.month,
    ),
    index('prescription_vs_idx').on(table.tenantId, table.svjId, table.variableSymbol),
  ],
);

/** What the monthly amount is made of: `fond_oprav`, `zalohy_sluzby`, `sprava`. */
export const prescriptionItem = svjTable(
  'prescription_item',
  {
    prescriptionId: uuid('prescription_id').notNull(),
    code: text('code').notNull(),
    label: text('label').notNull(),
    amount: numeric('amount', MONEY).notNull(),
  },
  (table) => [index('prescription_item_idx').on(table.tenantId, table.prescriptionId)],
);

/** The ledger of one unit: a prescription is negative, a payment positive, the sum is the balance. */
export const unitBalanceEntry = svjTable(
  'unit_balance_entry',
  {
    unitId: uuid('unit_id').notNull(),
    entryDate: date('entry_date').notNull(),
    kind: balanceEntryKindEnum('kind').notNull(),
    amount: numeric('amount', MONEY).notNull(),
    referenceType: text('reference_type'),
    referenceId: uuid('reference_id'),
  },
  (table) => [index('unit_balance_entry_idx').on(table.tenantId, table.svjId, table.unitId, table.entryDate)],
);
