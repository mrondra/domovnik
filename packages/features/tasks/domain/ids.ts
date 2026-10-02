import type { z } from 'zod';
import { brand } from '../../../kernel/src/ids/index';

export const taskIdSchema = brand('TaskId');

export type TaskId = z.infer<typeof taskIdSchema>;
