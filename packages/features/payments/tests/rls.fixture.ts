import { eq } from 'drizzle-orm';
import { withTenant } from '../../../kernel/src/db/index';
import { newRowId } from '../../../kernel/src/ids/index';
import type { TestTenant } from '../../../kernel/src/testing/index';
import { bankAccount, bankTransaction, paymentMatch } from '../schema';

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
    name: 'bank_account',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx
          .insert(bankAccount)
          .values({ ...svjRow(tenantId), number: newRowId(), bankCode: '2010', label: MARK });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) => (await tx.select().from(bankAccount).where(eq(bankAccount.label, MARK))).length,
      ),
  },
  {
    name: 'bank_transaction',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx.insert(bankTransaction).values({
          ...svjRow(tenantId),
          bankAccountId: newRowId(),
          externalId: newRowId(),
          bookedOn: '2026-09-15',
          amount: '3300.00',
          message: MARK,
          matchStatus: 'unmatched',
        });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) =>
          (await tx.select().from(bankTransaction).where(eq(bankTransaction.message, MARK))).length,
      ),
  },
  {
    name: 'payment_match',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx.insert(paymentMatch).values({
          ...svjRow(tenantId),
          transactionId: newRowId(),
          targetType: 'prescription',
          targetId: newRowId(),
          amount: '3300.00',
          method: 'vs_amount',
          confidence: '1.00',
        });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) =>
          (await tx.select().from(paymentMatch).where(eq(paymentMatch.method, 'vs_amount'))).length,
      ),
  },
];
