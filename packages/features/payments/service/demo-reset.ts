import { eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { bankTransaction, paymentMatch } from '../schema';

/**
 * The statement and what was decided about it. The accounts stay — an account is the house's, not
 * the demonstration's, and the seed opens it only when the SVJ has none (task 026).
 */
export const demoReset = (ctx: RequestContext): Promise<number> =>
  withTenant(ctx, async (tx) => {
    await tx.delete(paymentMatch).where(eq(paymentMatch.tenantId, ctx.tenantId));
    const removed = await tx
      .delete(bankTransaction)
      .where(eq(bankTransaction.tenantId, ctx.tenantId))
      .returning();

    await audit.record(ctx, {
      action: 'demo.reset',
      entity: 'bank_transaction',
      reason: 'Reset dema smazal bankovní pohyby a jejich párování',
      before: { count: removed.length },
    });

    return removed.length;
  });
