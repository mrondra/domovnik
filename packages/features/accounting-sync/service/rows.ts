import { z } from 'zod';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { syncConflictIdSchema, syncJobIdSchema } from '../domain/ids';
import type { SyncConflict, SyncJob } from '../domain/sync';
import type { syncConflict, syncJob } from '../schema/index';

const jsonObject = z.record(z.string(), z.unknown());

/** What a `jsonb` column holds is known to the writer, not to the type system; read it back once. */
export const payloadOf = (value: unknown): Readonly<Record<string, unknown>> => jsonObject.parse(value);

export const entityOf = (payload: unknown): string | null =>
  z.object({ entityId: z.string() }).safeParse(payload).data?.entityId ?? null;

export const toSyncJob = (row: typeof syncJob.$inferSelect): SyncJob => ({
  id: syncJobIdSchema.parse(row.id),
  svjId: svjIdSchema.parse(row.svjId),
  kind: row.kind,
  status: row.status,
  payload: payloadOf(row.payload),
  result: row.result === null ? null : payloadOf(row.result),
  error: row.error,
  attempts: row.attempts,
  createdAt: row.createdAt,
});

export const toSyncConflict = (row: typeof syncConflict.$inferSelect): SyncConflict => ({
  id: syncConflictIdSchema.parse(row.id),
  svjId: svjIdSchema.parse(row.svjId),
  entityType: row.entityType,
  entityId: row.entityId,
  field: row.field,
  ours: row.ours,
  theirs: row.theirs,
  status: row.status,
  resolution: row.resolution,
  createdAt: row.createdAt,
});
