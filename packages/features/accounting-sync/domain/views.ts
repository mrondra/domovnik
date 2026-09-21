import { z } from 'zod';

/** One zod definition per shape the browser sees, reused by the API and the screens (ADR 0017). */
export const syncJobSchema = z.object({
  id: z.uuid(),
  kind: z.enum(['post_invoice', 'liquidate', 'import_statements', 'import_receivables']),
  status: z.enum(['pending', 'running', 'done', 'failed']),
  error: z.string().nullable(),
  attempts: z.int().nonnegative(),
  createdAt: z.iso.datetime(),
});

export const conflictSchema = z.object({
  id: z.uuid(),
  entityType: z.string().min(1),
  entityId: z.uuid(),
  field: z.string().min(1),
  ours: z.unknown(),
  theirs: z.unknown(),
  status: z.enum(['open', 'resolved']),
  resolution: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export const accountingLinkSchema = z.object({
  svjId: z.uuid(),
  accountingAdapter: z.enum(['mock', 'mserver']),
  receivablesAdapter: z.enum(['internal', 'pohoda_other_receivables']),
  companyIco: z.string().min(1),
  lastSyncAt: z.iso.datetime().nullable(),
});

export const accountingStatusSchema = z.object({
  link: accountingLinkSchema.nullable(),
  jobs: z.array(syncJobSchema).readonly(),
  conflicts: z.array(conflictSchema).readonly(),
});

export const syncStatementsRequest = z.object({ from: z.iso.date(), to: z.iso.date() });

export const syncStatementsResponse = z.object({ count: z.int().nonnegative() });

export const resolveConflictRequest = z.object({
  resolution: z.enum(['keep_ours', 'take_theirs']),
  note: z.string().min(1),
});
