import { AsyncLocalStorage } from 'node:async_hooks';
import { sql } from 'drizzle-orm';
import { runInContext, type RequestContext } from '../context/index';
import { ForbiddenError } from '../errors/index';
import type { TenantId } from '../ids/index';
import { logger } from '../logger/index';
import { administrativeDb, applicationDb, type TenantTransaction } from './client';

interface ActiveTransaction {
  readonly tenantId: TenantId | null;
  readonly tx: TenantTransaction;
}

const transactionStore = new AsyncLocalStorage<ActiveTransaction>();

export const currentTransaction = (): TenantTransaction | undefined => transactionStore.getStore()?.tx;

const applySessionContext = async (tx: TenantTransaction, ctx: RequestContext): Promise<void> => {
  await tx.execute(sql`select
    set_config('app.tenant_id', ${ctx.tenantId}, true),
    set_config('app.actor_id', ${ctx.actor.id ?? ''}, true),
    set_config('app.actor_type', ${ctx.actor.type}, true)`);
};

/**
 * The only way to reach the database. Opens a transaction, pins the RLS session variables to `ctx`
 * and rolls back on any error. A nested call with the same tenant re-uses the open transaction so
 * a service can compose other services without losing atomicity.
 */
export const withTenant = async <T>(
  ctx: RequestContext,
  fn: (tx: TenantTransaction) => Promise<T>,
): Promise<T> => {
  const active = transactionStore.getStore();
  if (active !== undefined) {
    if (active.tenantId !== ctx.tenantId) {
      throw new ForbiddenError('Vnořená transakce nesmí přepnout tenanta', {
        code: 'tenant_switch_in_transaction',
        details: { from: active.tenantId, to: ctx.tenantId },
      });
    }
    return fn(active.tx);
  }

  return applicationDb().transaction(async (tx) => {
    await applySessionContext(tx, ctx);
    return transactionStore.run({ tenantId: ctx.tenantId, tx }, () => runInContext(ctx, () => fn(tx)));
  });
};

export interface SystemAccessOptions {
  readonly reason: string;
}

/**
 * Cross-tenant escape hatch for migrations, seed and maintenance jobs. It uses the owner connection,
 * so RLS does not apply — hence the mandatory reason and the warning in the log.
 */
export const withSystem = async <T>(
  options: SystemAccessOptions,
  fn: (tx: TenantTransaction) => Promise<T>,
): Promise<T> => {
  logger().warn({ reason: options.reason }, 'Cross-tenant access outside RLS');

  return administrativeDb().transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.actor_type', 'system', true)`);
    return transactionStore.run({ tenantId: null, tx }, () => fn(tx));
  });
};
