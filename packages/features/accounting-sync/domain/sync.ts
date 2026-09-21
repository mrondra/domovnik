import type { SvjId } from '../../../kernel/src/ids/index';
import type { SyncConflictId, SyncJobId } from './ids';

export type SyncJobKind = 'post_invoice' | 'liquidate' | 'import_statements' | 'import_receivables';
export type SyncJobStatus = 'pending' | 'running' | 'done' | 'failed';
export type ConflictStatus = 'open' | 'resolved';

/** What a person may decide about a disagreement; neither of them overwrites Pohoda (ADR 0005). */
export type ConflictResolution = 'keep_ours' | 'take_theirs';

/** One attempt to tell Pohoda something, or to read something back. Retried, never lost. */
export interface SyncJob {
  readonly id: SyncJobId;
  readonly svjId: SvjId;
  readonly kind: SyncJobKind;
  readonly status: SyncJobStatus;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly result: Readonly<Record<string, unknown>> | null;
  readonly error: string | null;
  readonly attempts: number;
  readonly createdAt: Date;
}

export interface SyncConflict {
  readonly id: SyncConflictId;
  readonly svjId: SvjId;
  readonly entityType: string;
  readonly entityId: string;
  readonly field: string;
  readonly ours: unknown;
  readonly theirs: unknown;
  readonly status: ConflictStatus;
  readonly resolution: string | null;
  readonly createdAt: Date;
}
