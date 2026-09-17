import { svjIdSchema } from '../../../kernel/src/ids/index';
import { storageKeySchema } from '../../../kernel/src/storage/index';
import { documentIdSchema } from '../domain/ids';
import { documentCategorySchema, documentSourceSchema } from '../domain/schemas';
import type { Document, LinkedEntity } from '../domain/types';

interface DocumentRow {
  readonly id: string;
  readonly svjId: string;
  readonly title: string;
  readonly category: string;
  readonly storageKey: string;
  readonly contentType: string | null;
  readonly size: number | null;
  readonly sha256: string;
  readonly source: string | null;
  readonly linkedEntityType: string | null;
  readonly linkedEntityId: string | null;
}

const toLinkedEntity = (row: DocumentRow): LinkedEntity | null =>
  row.linkedEntityType === null || row.linkedEntityId === null
    ? null
    : { type: row.linkedEntityType, id: row.linkedEntityId };

/** Drizzle hands back plain strings; the branded ids and the two enums are rebuilt here, once. */
export const toDocument = (row: DocumentRow): Document => ({
  id: documentIdSchema.parse(row.id),
  svjId: svjIdSchema.parse(row.svjId),
  title: row.title,
  category: documentCategorySchema.parse(row.category),
  storageKey: storageKeySchema.parse(row.storageKey),
  contentType: row.contentType,
  size: row.size,
  sha256: row.sha256,
  source: row.source === null ? null : documentSourceSchema.parse(row.source),
  linkedEntity: toLinkedEntity(row),
});
