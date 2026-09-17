import { z } from 'zod';

/** One zod definition per domain shape, reused by the event, the tools and the HTTP contract. */
export const documentCategorySchema = z.enum([
  'invoice',
  'contract',
  'inspection_report',
  'minutes',
  'other',
]);

/** How the file reached us; `system` is a document the platform produced itself. */
export const documentSourceSchema = z.enum(['email', 'upload', 'seed', 'system']);

const linkedEntitySchema = z.object({ type: z.string().min(1), id: z.uuid() });

const SHA256_LENGTH = 64;

export const documentSchema = z.object({
  id: z.uuid(),
  svjId: z.uuid(),
  title: z.string().min(1),
  category: documentCategorySchema,
  storageKey: z.string().min(1),
  contentType: z.string().min(1).nullable(),
  size: z.int().nonnegative().nullable(),
  sha256: z.string().length(SHA256_LENGTH),
  source: documentSourceSchema.nullable(),
  linkedEntity: linkedEntitySchema.nullable(),
});
