import { eq } from 'drizzle-orm';
import { withTenant } from '../../../kernel/src/db/index';
import { newRowId } from '../../../kernel/src/ids/index';
import type { TestTenant } from '../../../kernel/src/testing/index';
import { prescription, prescriptionItem, unitBalanceEntry } from '../schema';

/** The value every insert below carries, so one column is enough to find the row again. */
export const MARK = '990001';

export interface Isolation {
  readonly name: string;
  insert(tenant: TestTenant, tenantId: string): Promise<void>;
  count(tenant: TestTenant): Promise<number>;
}

const SVJ_TABLES: readonly Isolation[] = [
  {
    name: 'prescription',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx.insert(prescription).values({
          id: newRowId(),
          tenantId,
          svjId: newRowId(),
          unitId: newRowId(),
          year: 2026,
          month: 9,
          variableSymbol: MARK,
          totalAmount: '3300.00',
          dueDate: '2026-09-15',
          source: 'internal',
        });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) =>
          (await tx.select().from(prescription).where(eq(prescription.variableSymbol, MARK))).length,
      ),
  },
  {
    name: 'prescription_item',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx.insert(prescriptionItem).values({
          id: newRowId(),
          tenantId,
          svjId: newRowId(),
          prescriptionId: newRowId(),
          code: MARK,
          label: 'Fond oprav',
          amount: '1250.00',
        });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) =>
          (await tx.select().from(prescriptionItem).where(eq(prescriptionItem.code, MARK))).length,
      ),
  },
  {
    name: 'unit_balance_entry',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx.insert(unitBalanceEntry).values({
          id: newRowId(),
          tenantId,
          svjId: newRowId(),
          unitId: newRowId(),
          entryDate: '2026-09-15',
          kind: 'payment',
          amount: '3300.00',
          referenceType: MARK,
          referenceId: newRowId(),
        });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) =>
          (await tx.select().from(unitBalanceEntry).where(eq(unitBalanceEntry.referenceType, MARK))).length,
      ),
  },
];

export const ISOLATED_TABLES = SVJ_TABLES;
