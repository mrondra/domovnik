import type { z } from 'zod';
import type { conflictSchema } from '../domain/views';
import { accountingStatusSchema } from '../domain/views';

/** What the browser side of this feature sees; the screens fetch nothing themselves (ADR 0017). */
export const accountingStatusView = accountingStatusSchema;

export type AccountingStatusView = z.output<typeof accountingStatusSchema>;
export type ConflictView = z.output<typeof conflictSchema>;
export type SyncJobView = AccountingStatusView['jobs'][number];
