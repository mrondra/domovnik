import type { RequestContext } from '../context/request-context';
import { auditLog } from '../db/schema/index';
import { currentTransaction } from '../db/tenant';
import { DomainError } from '../errors/taxonomy';
import { newRowId } from '../ids/brand';

export interface AuditEntry {
  readonly action: string;
  readonly entity: string;
  readonly entityId?: string | undefined;
  readonly reason: string;
  readonly before?: unknown;
  readonly after?: unknown;
}

/**
 * Explicit rather than a Drizzle hook (ADR 0011): `reason` is knowledge only the calling service
 * has, and a hook would have to smuggle it through ambient state to reach the same row.
 */
export const record = async (ctx: RequestContext, entry: AuditEntry): Promise<void> => {
  const tx = currentTransaction();
  if (tx === undefined) {
    throw new DomainError('audit.record musí běžet uvnitř withTenant', {
      code: 'audit_outside_transaction',
      details: { action: entry.action, entity: entry.entity },
    });
  }

  await tx.insert(auditLog).values({
    id: newRowId(),
    tenantId: ctx.tenantId,
    createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ?? null,
    reason: entry.reason,
    before: entry.before ?? null,
    after: entry.after ?? null,
    actorType: ctx.actor.type,
    actorId: ctx.actor.id,
    correlationId: ctx.correlationId,
    agentRunId: ctx.agentRunId ?? null,
  });
};
