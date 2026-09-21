import { and, desc, eq } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { newId, type SvjId } from '../../../kernel/src/ids/index';
import { syncJobIdSchema, type SyncJobId } from '../domain/ids';
import type { SyncJob, SyncJobKind } from '../domain/sync';
import { syncJob } from '../schema/index';
import { entityOf, toSyncJob } from './rows';

export interface StartJobInput {
  readonly svjId: SvjId;
  readonly kind: SyncJobKind;
  readonly payload: Readonly<Record<string, unknown>>;
}

const RECENT = 20;

/**
 * Every exchange with the accounting leaves a row behind, whether it worked or not. A retry of the
 * same event finds the previous attempt and counts up rather than starting a second history of the
 * same thing (task 025).
 */
export const startJob = (ctx: RequestContext, input: StartJobInput): Promise<SyncJobId> =>
  withTenant(ctx, async (tx) => {
    const id = newId(syncJobIdSchema);
    await tx.insert(syncJob).values({
      id,
      tenantId: ctx.tenantId,
      svjId: input.svjId,
      createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
      kind: input.kind,
      status: 'running',
      payload: input.payload,
      attempts: 1,
    });
    return id;
  });

export const finishJob = (
  ctx: RequestContext,
  jobId: SyncJobId,
  result: Readonly<Record<string, unknown>>,
): Promise<void> =>
  withTenant(ctx, async (tx) => {
    await tx
      .update(syncJob)
      .set({ status: 'done', result, error: null, updatedAt: new Date() })
      .where(eq(syncJob.id, jobId));
  });

/** A failure is written down before it is rethrown, so a job that keeps failing says why. */
const failJob = (ctx: RequestContext, jobId: SyncJobId, error: string): Promise<void> =>
  withTenant(ctx, async (tx) => {
    await tx
      .update(syncJob)
      .set({ status: 'failed', error, updatedAt: new Date() })
      .where(eq(syncJob.id, jobId));
  });

/**
 * One exchange with the accounting, from both ends: whatever happens in between is written down
 * before the caller hears about it. A thrown error is rethrown — deciding whether it is worth
 * another try is the subscriber's business, not this one's.
 */
export const runJob = async <T>(
  ctx: RequestContext,
  input: StartJobInput,
  work: () => Promise<{ readonly result: Readonly<Record<string, unknown>>; readonly value: T }>,
): Promise<T> => {
  const jobId = await startJob(ctx, input);

  try {
    const done = await work();
    await finishJob(ctx, jobId, done.result);
    return done.value;
  } catch (error) {
    await failJob(ctx, jobId, error instanceof Error ? error.message : String(error));
    throw error;
  }
};

export const listJobs = (ctx: RequestContext, svjId: SvjId): Promise<readonly SyncJob[]> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(syncJob)
      .where(eq(syncJob.svjId, svjId))
      .orderBy(desc(syncJob.createdAt))
      .limit(RECENT);

    return rows.map(toSyncJob);
  });

/** What has already been told to Pohoda about this entity, so a redelivery does not tell it twice. */
export const jobDone = (
  ctx: RequestContext,
  svjId: SvjId,
  kind: SyncJobKind,
  entityId: string,
): Promise<boolean> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({ payload: syncJob.payload })
      .from(syncJob)
      .where(and(eq(syncJob.svjId, svjId), eq(syncJob.kind, kind), eq(syncJob.status, 'done')));

    return rows.some((row) => entityOf(row.payload) === entityId);
  });
