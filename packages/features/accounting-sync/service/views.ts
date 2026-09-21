import type { z } from 'zod';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { SyncConflict, SyncJob } from '../domain/sync';
import type { accountingStatusSchema, conflictSchema, syncJobSchema } from '../domain/views';
import { accountingStatus } from './status';

type JobView = z.output<typeof syncJobSchema>;
type ConflictView = z.output<typeof conflictSchema>;

const jobView = (job: SyncJob): JobView => ({
  id: job.id,
  kind: job.kind,
  status: job.status,
  error: job.error,
  attempts: job.attempts,
  createdAt: job.createdAt.toISOString(),
});

export const conflictView = (conflict: SyncConflict): ConflictView => ({
  id: conflict.id,
  entityType: conflict.entityType,
  entityId: conflict.entityId,
  field: conflict.field,
  ours: conflict.ours,
  theirs: conflict.theirs,
  status: conflict.status,
  resolution: conflict.resolution,
  createdAt: conflict.createdAt.toISOString(),
});

/**
 * Dates cross the wire as strings: a `Date` cannot be described in JSON Schema, and the OpenAPI
 * document is generated from these schemas (task 019).
 */
export const accountingStatusView = async (
  ctx: RequestContext,
  svjId: SvjId,
): Promise<z.output<typeof accountingStatusSchema>> => {
  const status = await accountingStatus(ctx, svjId);

  return {
    link:
      status.link === null
        ? null
        : {
            svjId: status.link.svjId,
            accountingAdapter: status.link.accountingAdapter,
            receivablesAdapter: status.link.receivablesAdapter,
            companyIco: status.link.companyIco,
            lastSyncAt: status.link.lastSyncAt?.toISOString() ?? null,
          },
    jobs: status.jobs.map(jobView),
    conflicts: status.conflicts.map(conflictView),
  };
};
