import { z } from 'zod';
import { defineEvent } from '../../../kernel/src/events/index';
import { documentCategorySchema } from './schemas';

const SHA256_LENGTH = 64;

/**
 * Domain events are past tense and named `domena.entita.akce` (docs/engineering.md §3). It carries
 * the hash so a subscriber can recognise a document it already filed without reading it back.
 */
export const documentStored = defineEvent(
  'documents.document.stored',
  z.object({
    documentId: z.uuid(),
    svjId: z.uuid(),
    category: documentCategorySchema,
    sha256: z.string().length(SHA256_LENGTH),
  }),
);
