import { index, integer, pgEnum, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { svjTable } from '../../kernel/src/db/index';

export const documentCategoryEnum = pgEnum('document_category', [
  'invoice',
  'contract',
  'inspection_report',
  'minutes',
  'other',
]);

/**
 * Metadata only: the bytes live in object storage under `storageKey`, which is unique per tenant so
 * the same object can never be claimed by two rows. `sha256` is what makes a re-sent invoice
 * recognisable as the one already filed, hence its own index (task 011).
 *
 * `linkedEntityType` / `linkedEntityId` are deliberately untyped: a document points at whatever
 * feature produced it, and a foreign key would make `documents` depend on all of them.
 */
export const document = svjTable(
  'document',
  {
    title: text('title').notNull(),
    category: documentCategoryEnum('category').notNull(),
    storageKey: text('storage_key').notNull(),
    contentType: text('content_type'),
    size: integer('size'),
    sha256: text('sha256').notNull(),
    source: text('source'),
    linkedEntityType: text('linked_entity_type'),
    linkedEntityId: uuid('linked_entity_id'),
  },
  (table) => [
    uniqueIndex('document_storage_key_unique').on(table.tenantId, table.storageKey),
    index('document_category_idx').on(table.tenantId, table.svjId, table.category),
    index('document_sha256_idx').on(table.tenantId, table.sha256),
  ],
);
