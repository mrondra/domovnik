import { index, integer, jsonb, pgEnum, text } from 'drizzle-orm/pg-core';
import { svjTable } from '../../../kernel/src/db/index';

export const syncKindEnum = pgEnum('sync_kind', [
  'post_invoice',
  'liquidate',
  'import_statements',
  'import_receivables',
]);

export const syncStatusEnum = pgEnum('sync_status', ['pending', 'running', 'done', 'failed']);

export const conflictStatusEnum = pgEnum('conflict_status', ['open', 'resolved']);

/** One attempt to tell Pohoda something, or to read something back. Retried, never lost. */
export const syncJob = svjTable(
  'sync_job',
  {
    kind: syncKindEnum('kind').notNull(),
    status: syncStatusEnum('status').notNull(),
    payload: jsonb('payload').notNull(),
    result: jsonb('result'),
    error: text('error'),
    attempts: integer('attempts').notNull().default(0),
  },
  (table) => [index('sync_job_status_idx').on(table.tenantId, table.svjId, table.status)],
);

/**
 * Where our copy and Pohoda disagree. The sync writes one of these rather than overwriting either
 * side: Pohoda is the source of truth for the accounting, and a silent overwrite would lose the
 * thing somebody did there on purpose (ADR 0005).
 */
export const syncConflict = svjTable(
  'sync_conflict',
  {
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    field: text('field').notNull(),
    ours: jsonb('ours'),
    theirs: jsonb('theirs'),
    status: conflictStatusEnum('status').notNull(),
    resolution: text('resolution'),
  },
  (table) => [index('sync_conflict_status_idx').on(table.tenantId, table.svjId, table.status)],
);
