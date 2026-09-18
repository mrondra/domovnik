import { date, index, numeric, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { svjTable, tenantTable } from '../../../kernel/src/db/index';

const MONEY = { precision: 12, scale: 2 } as const;

/**
 * A supplier belongs to the management company, not to an SVJ: the same lift service invoices
 * several houses, and the address book is synchronised with Pohoda as one (zadání kap. 4).
 */
export const supplier = tenantTable(
  'supplier',
  {
    name: text('name').notNull(),
    ico: text('ico').notNull(),
    dic: text('dic'),
    bankAccount: text('bank_account'),
    email: text('email'),
  },
  (table) => [uniqueIndex('supplier_ico_unique').on(table.tenantId, table.ico)],
);

/**
 * What an SVJ has agreed to pay a supplier for. `budgetCategory` is what makes an invoice under this
 * contract land in the right line of the budget, and `documentId` points at the signed scan.
 */
export const contract = svjTable(
  'contract',
  {
    supplierId: uuid('supplier_id').notNull(),
    subject: text('subject').notNull(),
    budgetCategory: text('budget_category').notNull(),
    monthlyAmount: numeric('monthly_amount', MONEY),
    validFrom: date('valid_from').notNull(),
    validTo: date('valid_to'),
    documentId: uuid('document_id'),
  },
  (table) => [index('contract_supplier_idx').on(table.tenantId, table.svjId, table.supplierId)],
);
