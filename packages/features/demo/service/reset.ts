import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { schema, withTenant } from '../../../kernel/src/db/index';
import { resetAccountingSync } from '../../accounting-sync/index';
import { resetDocuments } from '../../documents/index';
import { resetInvoices } from '../../invoices/index';
import { resetPayments } from '../../payments/index';
import { resetReceivables } from '../../receivables/index';
import type { ResetResult } from '../domain/types';

/**
 * Each feature says what of its own data a demonstration produced, and `demo` never names another
 * feature's tables. The order is the order of the chain: the accounting first, then the money,
 * then what it was about (task 026).
 */
const HANDLERS: readonly ((ctx: RequestContext) => Promise<number>)[] = [
  resetAccountingSync,
  resetPayments,
  resetReceivables,
  resetInvoices,
  resetDocuments,
];

/**
 * Approvals, agent runs and anything still queued in the outbox: all of them are the kernel's own
 * and all of them are about rows that are going away. An event already handed to the queue cannot
 * be recalled — what is left of it is a handler that finds nothing and does nothing.
 */
const forgetDecisions = (ctx: RequestContext): Promise<number> =>
  withTenant(ctx, async (tx) => {
    const removed = await tx.delete(schema.approval).returning();
    await tx.delete(schema.agentRun);
    await tx.delete(schema.event);

    return removed.length;
  });

/**
 * Puts the tenant back to the state the seed leaves it in: everything a demonstration produced is
 * deleted, and everything the seed gave it — houses, units, prescriptions, suppliers, contracts,
 * budgets, bank accounts, the accounting link — stays. Nothing is re-seeded, because nothing the
 * seed wrote is touched.
 *
 * Audited like anything else somebody does: a reset that left no trace would be indistinguishable
 * from data loss (ADR 0011).
 */
export const resetDemo = async (ctx: RequestContext): Promise<ResetResult> => {
  let removed = await forgetDecisions(ctx);
  for (const handler of HANDLERS) {
    removed += await handler(ctx);
  }

  await withTenant(ctx, async () => {
    await audit.record(ctx, {
      action: 'demo.reset',
      entity: 'tenant',
      entityId: ctx.tenantId,
      reason: 'Reset dema',
      after: { removed },
    });
  });

  return { removed };
};
