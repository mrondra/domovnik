import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { AccountingLink } from '../domain/types';
import type { SyncConflict, SyncJob } from '../domain/sync';
import { listConflicts } from './conflict-decisions';
import { listJobs } from './jobs';
import { linkOf } from './links';

export interface AccountingStatus {
  readonly link: AccountingLink | null;
  readonly jobs: readonly SyncJob[];
  readonly conflicts: readonly SyncConflict[];
}

/**
 * What the accounting screen shows: where this house is booked, what was last said to Pohoda, and
 * what the two sides do not agree about. A house nobody linked answers a link of `null` rather
 * than an error — not being connected yet is a state, not a fault (task 025).
 */
export const accountingStatus = async (ctx: RequestContext, svjId: SvjId): Promise<AccountingStatus> => {
  const link = await linkOf(ctx, svjId);
  if (link === null) return { link: null, jobs: [], conflicts: [] };

  return {
    link,
    jobs: await listJobs(ctx, svjId),
    conflicts: await listConflicts(ctx, svjId),
  };
};
