import { eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { invoice } from '../schema/index';

/**
 * What a demonstration may throw away and the seed can write again. Suppliers, contracts and budget
 * lines stay: they are what the house has agreed with whom, not what the demonstration produced —
 * and an invoice without its supplier would make the next run tell a different story (task 026).
 */
export const demoReset = (ctx: RequestContext): Promise<number> =>
  withTenant(ctx, async (tx) => {
    const removed = await tx.delete(invoice).where(eq(invoice.tenantId, ctx.tenantId)).returning();

    await audit.record(ctx, {
      action: 'demo.reset',
      entity: 'invoice',
      reason: 'Reset dema smazal faktury',
      before: { count: removed.length },
    });

    return removed.length;
  });
