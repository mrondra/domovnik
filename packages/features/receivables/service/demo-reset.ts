import { and, eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { unitBalanceEntry } from '../schema';

/**
 * Only what the money did: the payments recorded against the ledger. The prescriptions and their
 * debit entries stay, because they are what the house was asked to pay — deleting them would make
 * the seed write new ones with new variable symbols, and the demonstration would stop matching
 * the statement it generates (task 026).
 */
export const demoReset = (ctx: RequestContext): Promise<number> =>
  withTenant(ctx, async (tx) => {
    const removed = await tx
      .delete(unitBalanceEntry)
      .where(and(eq(unitBalanceEntry.tenantId, ctx.tenantId), eq(unitBalanceEntry.kind, 'payment')))
      .returning();

    await audit.record(ctx, {
      action: 'demo.reset',
      entity: 'unit_balance_entry',
      reason: 'Reset dema smazal zaúčtované úhrady',
      before: { count: removed.length },
    });

    return removed.length;
  });
