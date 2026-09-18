import { date, index, jsonb, numeric, pgEnum, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { svjTable } from '../../../kernel/src/db/index';

/** The life of an incoming invoice (zadání kap. 4); `domain/status.ts` says which step follows which. */
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'received',
  'extracted',
  'needs_review',
  'pending_approval',
  'approved',
  'rejected',
  'posted',
  'paid',
]);

const MONEY = { precision: 12, scale: 2 } as const;

/**
 * Everything but `document_id` and `status` starts empty: an invoice exists the moment the file
 * arrives, and extraction (016) fills the rest in. `extraction` keeps what the model read and
 * `checks` what the deterministic rules made of it, so a decision can always be explained later.
 */
export const invoice = svjTable(
  'invoice',
  {
    status: invoiceStatusEnum('status').notNull(),
    supplierId: uuid('supplier_id'),
    contractId: uuid('contract_id'),
    documentId: uuid('document_id').notNull(),
    externalNumber: text('external_number'),
    variableSymbol: text('variable_symbol'),
    issuedOn: date('issued_on'),
    dueOn: date('due_on'),
    amountTotal: numeric('amount_total', MONEY),
    amountVat: numeric('amount_vat', MONEY),
    currency: text('currency').notNull().default('CZK'),
    budgetCategory: text('budget_category'),
    extraction: jsonb('extraction'),
    checks: jsonb('checks'),
    agentRunId: uuid('agent_run_id'),
    approvalId: uuid('approval_id'),
    accountingRef: text('accounting_ref'),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    source: text('source').notNull(),
  },
  (table) => [
    index('invoice_status_idx').on(table.tenantId, table.svjId, table.status),
    uniqueIndex('invoice_external_number_unique')
      .on(table.tenantId, table.supplierId, table.externalNumber)
      .where(sql`${table.externalNumber} is not null`),
  ],
);

export const invoiceLine = svjTable(
  'invoice_line',
  {
    invoiceId: uuid('invoice_id').notNull(),
    description: text('description').notNull(),
    quantity: numeric('quantity').notNull(),
    unitPrice: numeric('unit_price', MONEY).notNull(),
    amount: numeric('amount', MONEY).notNull(),
  },
  (table) => [index('invoice_line_idx').on(table.tenantId, table.invoiceId)],
);
