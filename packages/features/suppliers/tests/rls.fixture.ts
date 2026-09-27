import { eq } from 'drizzle-orm';
import { withTenant } from '../../../kernel/src/db/index';
import { newRowId } from '../../../kernel/src/ids/index';
import type { TestTenant } from '../../../kernel/src/testing/index';
import { contract, supplier } from '../schema';

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
    name: 'supplier',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx.insert(supplier).values({ id: newRowId(), tenantId, name: MARK, ico: newRowId() });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) => (await tx.select().from(supplier).where(eq(supplier.name, MARK))).length,
      ),
  },
  {
    name: 'contract',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx.insert(contract).values({
          ...svjRow(tenantId),
          supplierId: newRowId(),
          subject: MARK,
          budgetCategory: 'vytah',
          validFrom: '2026-01-01',
        });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) => (await tx.select().from(contract).where(eq(contract.subject, MARK))).length,
      ),
  },
];
