import { and, desc, eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { SyncConflictId } from '../domain/ids';
import type { ConflictResolution, SyncConflict } from '../domain/sync';
import { syncConflict } from '../schema/index';
import { toSyncConflict } from './rows';

export const listConflicts = (
  ctx: RequestContext,
  svjId: SvjId,
  status?: 'open' | 'resolved',
): Promise<readonly SyncConflict[]> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(syncConflict)
      .where(
        status === undefined
          ? eq(syncConflict.svjId, svjId)
          : and(eq(syncConflict.svjId, svjId), eq(syncConflict.status, status)),
      )
      .orderBy(desc(syncConflict.createdAt));

    return rows.map(toSyncConflict);
  });

export const getConflict = (ctx: RequestContext, id: SyncConflictId): Promise<SyncConflict> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select().from(syncConflict).where(eq(syncConflict.id, id)).limit(1);
    const row = rows[0];
    if (row === undefined) {
      throw new NotFoundError('Konflikt nenalezen', { code: 'conflict_not_found', details: { id } });
    }
    return toSyncConflict(row);
  });

export interface ResolveConflictInput {
  readonly conflictId: SyncConflictId;
  readonly resolution: ConflictResolution;
  readonly note: string;
}

const RESOLUTION_LABEL: Readonly<Record<ConflictResolution, string>> = {
  keep_ours: 'Platí naše hodnota, v Pohodě se opraví ručně',
  take_theirs: 'Platí hodnota z Pohody',
};

/**
 * Closing a disagreement is a decision somebody signs, not an overwrite: neither side is written
 * over from here, because Pohoda is the source of truth for the books and our copy is the record
 * of what the platform did (ADR 0005). What the decision means for the invoice is a person's next
 * step, and the note is what they leave for whoever reads it.
 */
export const resolveConflict = (ctx: RequestContext, input: ResolveConflictInput): Promise<SyncConflict> =>
  withTenant(ctx, async (tx) => {
    const before = await getConflict(ctx, input.conflictId);
    const resolution = `${RESOLUTION_LABEL[input.resolution]}: ${input.note}`;

    await tx
      .update(syncConflict)
      .set({ status: 'resolved', resolution, updatedAt: new Date() })
      .where(eq(syncConflict.id, input.conflictId));

    await audit.record(ctx, {
      action: 'accounting.conflict.resolved',
      entity: 'sync_conflict',
      entityId: input.conflictId,
      reason: resolution,
      before: { status: before.status },
      after: { status: 'resolved', resolution: input.resolution },
    });

    return { ...before, status: 'resolved', resolution };
  });
