import type { z } from 'zod';
import { brand } from '../../../kernel/src/ids/index';

export const syncJobIdSchema = brand('SyncJobId');
export const syncConflictIdSchema = brand('SyncConflictId');

export type SyncJobId = z.infer<typeof syncJobIdSchema>;
export type SyncConflictId = z.infer<typeof syncConflictIdSchema>;
