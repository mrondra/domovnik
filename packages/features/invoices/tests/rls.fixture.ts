import { eq } from 'drizzle-orm';
import { withTenant } from '../../../kernel/src/db/index';
import { newRowId } from '../../../kernel/src/ids/index';
import type { TestTenant } from '../../../kernel/src/testing/index';
import { budgetLine, invoice, invoiceLine } from '../schema/index';

/** The value every insert below carries, so one column is enough to find the row again. */
export const MARK = 'značka prvního správce';

export interface Isolation {
  readonly name: string;
  insert(tenant: TestTenant, tenantId: string): Promise<void>;
  count(tenant: TestTenant): Promise<number>;
}

const svjRow = (tenantId: string): { id: string; tenantId: string; svjId: string } => ({
  id: newRowId(),
  tenantId,
  svjId: newRowId(),
});

export const ISOLATED_TABLES: readonly Isolation[] = [
  {
    name: 'budget_line',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx
          .insert(budgetLine)
          .values({ ...svjRow(tenantId), year: 2026, category: MARK, plannedAmount: '1000.00' });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) => (await tx.select().from(budgetLine).where(eq(budgetLine.category, MARK))).length,
      ),
  },
  {
    name: 'invoice',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx.insert(invoice).values({
          ...svjRow(tenantId),
          status: 'received',
          documentId: newRowId(),
          source: MARK,
        });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) => (await tx.select().from(invoice).where(eq(invoice.source, MARK))).length,
      ),
  },
  {
    name: 'invoice_line',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx.insert(invoiceLine).values({
          ...svjRow(tenantId),
          invoiceId: newRowId(),
          description: MARK,
          quantity: '1',
          unitPrice: '100.00',
          amount: '100.00',
        });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) => (await tx.select().from(invoiceLine).where(eq(invoiceLine.description, MARK))).length,
      ),
  },
];
