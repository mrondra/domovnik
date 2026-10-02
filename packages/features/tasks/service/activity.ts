import { withSvj, type RequestContext } from '../../../kernel/src/context/index';
import type { TenantTransaction } from '../../../kernel/src/db/index';
import { events, type EventEnvelope } from '../../../kernel/src/events/index';
import { newRowId, svjIdSchema } from '../../../kernel/src/ids/index';
import type { TaskActivityKind } from '../domain/types';
import { taskActivity } from '../schema';

export interface ActivityEntry {
  readonly taskId: string;
  readonly kind: TaskActivityKind;
  readonly body?: string | undefined;
  readonly data?: Record<string, unknown> | undefined;
}

/** The history line every mutation leaves next to its audit row, written by whoever acted. */
export const recordActivity = async (
  ctx: RequestContext,
  tx: TenantTransaction,
  entry: ActivityEntry,
): Promise<void> => {
  await tx.insert(taskActivity).values({
    id: newRowId(),
    tenantId: ctx.tenantId,
    createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
    taskId: entry.taskId,
    kind: entry.kind,
    body: entry.body ?? null,
    data: entry.data ?? null,
    actorType: ctx.actor.type,
    actorId: ctx.actor.id,
  });
};

/** The event carries the SVJ of its task, so a subscriber for one house is not woken by another's. */
export const emitFor = async (
  ctx: RequestContext,
  svjId: string | null,
  envelope: EventEnvelope,
): Promise<void> => {
  await events.emit(svjId === null ? ctx : withSvj(ctx, svjIdSchema.parse(svjId)), envelope);
};
