import { and, eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { document } from '../schema';

/**
 * The filed invoices, and nothing else that was ever filed. The objects themselves stay in storage:
 * the seed uploads them under the same key, and a demonstration that deleted a contract scan would
 * be throwing away something nobody can write again (task 026).
 */
export const demoReset = (ctx: RequestContext): Promise<number> =>
  withTenant(ctx, async (tx) => {
    const removed = await tx
      .delete(document)
      .where(and(eq(document.tenantId, ctx.tenantId), eq(document.category, 'invoice')))
      .returning();

    await audit.record(ctx, {
      action: 'demo.reset',
      entity: 'document',
      reason: 'Reset dema smazal dokumenty faktur',
      before: { count: removed.length },
    });

    return removed.length;
  });
