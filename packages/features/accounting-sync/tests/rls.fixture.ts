import { eq } from 'drizzle-orm';
import { withTenant } from '../../../kernel/src/db/index';
import { newRowId } from '../../../kernel/src/ids/index';
import type { TestTenant } from '../../../kernel/src/testing/index';
import { accountingLink, pohodaMockStore, syncConflict, syncJob } from '../schema';

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
    name: 'accounting_link',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx.insert(accountingLink).values({
          ...svjRow(tenantId),
          accountingAdapter: 'mock',
          receivablesAdapter: 'internal',
          companyIco: MARK,
        });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) =>
          (await tx.select().from(accountingLink).where(eq(accountingLink.companyIco, MARK))).length,
      ),
  },
  {
    name: 'sync_job',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx.insert(syncJob).values({
          ...svjRow(tenantId),
          kind: 'post_invoice',
          status: 'pending',
          payload: { note: MARK },
          error: MARK,
        });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) => (await tx.select().from(syncJob).where(eq(syncJob.error, MARK))).length,
      ),
  },
  {
    name: 'sync_conflict',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx.insert(syncConflict).values({
          ...svjRow(tenantId),
          entityType: 'invoice',
          entityId: newRowId(),
          field: MARK,
          status: 'open',
        });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) => (await tx.select().from(syncConflict).where(eq(syncConflict.field, MARK))).length,
      ),
  },
  {
    name: 'pohoda_mock_store',
    insert: (tenant, tenantId) =>
      withTenant(tenant.ctx, async (tx) => {
        await tx.insert(pohodaMockStore).values({
          ...svjRow(tenantId),
          ref: newRowId(),
          kind: MARK,
          xml: '<dat:dataPack/>',
          state: {},
        });
      }),
    count: (tenant) =>
      withTenant(
        tenant.ctx,
        async (tx) => (await tx.select().from(pohodaMockStore).where(eq(pohodaMockStore.kind, MARK))).length,
      ),
  },
];
