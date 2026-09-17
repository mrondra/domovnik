import type { z } from 'zod';
import { brand } from '../../../kernel/src/ids/index';

export const documentIdSchema = brand('DocumentId');

export type DocumentId = z.infer<typeof documentIdSchema>;
