import { approvals } from '../../../../packages/kernel/src/approvals/index';
import { createContext, type RequestContext } from '../../../../packages/kernel/src/context/index';
import { withTenant } from '../../../../packages/kernel/src/db/index';
import { events, type EventEnvelope } from '../../../../packages/kernel/src/events/index';
import { listActiveTenants } from '../../../../packages/kernel/src/identity/index';
import type { TenantId } from '../../../../packages/kernel/src/ids/index';

/** `tick.daily` and `tick.monthly` from the kernel; anything shaped like them would do. */
export interface Tick {
  readonly name: string;
  create(payload: { at: string }): EventEnvelope;
}

const systemContextOf = (tenantId: TenantId): RequestContext =>
  createContext({ tenantId, actor: { type: 'system', id: null, roles: [] } });

/**
 * A tick is emitted once per tenant, not once globally: every consumer downstream reads its data
 * through `withTenant`, so an event without a tenant would have nothing to run against. The clock
 * belongs to the scheduler, which is why `at` travels in the payload rather than being read again
 * by each handler.
 */
export const emitTickForEveryTenant = async (tick: Tick, at: Date): Promise<number> => {
  const tenants = await listActiveTenants();
  const envelope = tick.create({ at: at.toISOString() });

  await Promise.all(
    tenants.map((tenantId) => {
      const ctx = systemContextOf(tenantId);
      return withTenant(ctx, () => events.emit(ctx, envelope));
    }),
  );

  return tenants.length;
};

/** Deadlines pass without anyone asking, so something periodic has to notice (kernel `approvals`). */
export const expireOverdueApprovals = async (): Promise<number> => {
  const tenants = await listActiveTenants();
  const counts = await Promise.all(tenants.map((tenantId) => approvals.expire(systemContextOf(tenantId))));
  return counts.reduce((total, count) => total + count, 0);
};
