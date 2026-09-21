import { and, eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import { withSvj, type RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { events } from '../../../kernel/src/events/index';
import { newId, type SvjId } from '../../../kernel/src/ids/index';
import { syncConflictDetected } from '../domain/events';
import { syncConflictIdSchema, type SyncConflictId } from '../domain/ids';
import { syncConflict } from '../schema/index';

export interface OpenConflictInput {
  readonly svjId: SvjId;
  readonly entityType: string;
  readonly entityId: string;
  readonly field: string;
  readonly ours: unknown;
  readonly theirs: unknown;
}

/** One open conflict per entity and field: a sweep that runs daily must not pile up the same one. */
export const openConflict = (ctx: RequestContext, input: OpenConflictInput): Promise<SyncConflictId | null> =>
  withTenant(ctx, async (tx) => {
    const existing = await tx
      .select({ id: syncConflict.id })
      .from(syncConflict)
      .where(
        and(
          eq(syncConflict.entityId, input.entityId),
          eq(syncConflict.field, input.field),
          eq(syncConflict.status, 'open'),
        ),
      )
      .limit(1);
    if (existing[0] !== undefined) return null;

    const id = newId(syncConflictIdSchema);
    await tx.insert(syncConflict).values({
      id,
      tenantId: ctx.tenantId,
      svjId: input.svjId,
      createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
      entityType: input.entityType,
      entityId: input.entityId,
      field: input.field,
      ours: input.ours,
      theirs: input.theirs,
      status: 'open',
    });

    await audit.record(ctx, {
      action: 'accounting.conflict.opened',
      entity: 'sync_conflict',
      entityId: id,
      reason: `Účetnictví má u ${input.entityType} jiné ${input.field}`,
      after: { ours: input.ours, theirs: input.theirs },
    });

    return id;
  });

/** Told once for the whole sweep, so the guard agent is woken once and given the batch (ADR 0004). */
export const announceConflicts = async (
  ctx: RequestContext,
  svjId: SvjId,
  conflictIds: readonly SyncConflictId[],
): Promise<void> => {
  if (conflictIds.length === 0) return;

  await withTenant(ctx, async () => {
    await events.emit(
      withSvj(ctx, svjId),
      syncConflictDetected.create({ svjId, conflictIds: [...conflictIds] }),
    );
  });
};
