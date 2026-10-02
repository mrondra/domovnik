import { eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { task, taskActivity } from '../schema';

/**
 * Every task of the tenant, with its history. The seed raises no task (zadání 031), so whatever
 * exists was raised by a demonstration — from an origin or by hand after the seed — and there is
 * nothing to tell apart. Returns how many tasks it removed.
 */
export const demoReset = (ctx: RequestContext): Promise<number> =>
  withTenant(ctx, async (tx) => {
    await tx.delete(taskActivity).where(eq(taskActivity.tenantId, ctx.tenantId));
    const removed = await tx.delete(task).where(eq(task.tenantId, ctx.tenantId)).returning();

    await audit.record(ctx, {
      action: 'demo.reset',
      entity: 'task',
      reason: 'Reset dema smazal úkoly a jejich historii',
      before: { count: removed.length },
    });

    return removed.length;
  });
