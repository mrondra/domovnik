import { eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { pohodaMockStore, syncConflict, syncJob } from '../schema/index';

/**
 * What was said to the accounting, and what the demo's Pohoda was told to remember — including the
 * documents themselves, because the invoices they are about are going away too. The link stays:
 * where a house is booked is a setting, not something a demonstration produced (task 026).
 */
export const demoReset = (ctx: RequestContext): Promise<number> =>
  withTenant(ctx, async (tx) => {
    await tx.delete(syncConflict).where(eq(syncConflict.tenantId, ctx.tenantId));
    await tx.delete(pohodaMockStore).where(eq(pohodaMockStore.tenantId, ctx.tenantId));
    const removed = await tx.delete(syncJob).where(eq(syncJob.tenantId, ctx.tenantId)).returning();

    await audit.record(ctx, {
      action: 'demo.reset',
      entity: 'sync_job',
      reason: 'Reset dema smazal výměny s účetnictvím a konflikty',
      before: { count: removed.length },
    });

    return removed.length;
  });
