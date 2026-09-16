import { index, integer, numeric, pgEnum, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { svjTable, tenantTable } from '../../kernel/src/db/index';

export const unitKindEnum = pgEnum('unit_kind', ['apartment', 'commercial', 'garage']);

/**
 * The SVJ itself is tenant-scoped, not SVJ-scoped: it *is* the SVJ, so `svjTable` would only give it
 * a second copy of its own id. Everything below it goes through `svjTable` (docs/engineering.md §8).
 *
 * `committee` and `bankAccounts` are JSON because the demo needs them readable, not queryable; a
 * real committee term with dates and a real bank account belong to their own tables later.
 */
export const svj = tenantTable(
  'svj',
  {
    name: text('name').notNull(),
    ico: text('ico').notNull(),
    street: text('street').notNull(),
    city: text('city').notNull(),
    postalCode: text('postal_code').notNull(),
    committee: uuid('committee').array().notNull().default([]),
    bankAccounts: text('bank_accounts').array().notNull().default([]),
  },
  (table) => [uniqueIndex('svj_ico_unique').on(table.tenantId, table.ico)],
);

export const building = svjTable(
  'building',
  {
    label: text('label').notNull(),
    street: text('street').notNull(),
  },
  (table) => [uniqueIndex('building_label_unique').on(table.tenantId, table.svjId, table.label)],
);

export const unit = svjTable(
  'unit',
  {
    buildingId: uuid('building_id').notNull(),
    number: text('number').notNull(),
    kind: unitKindEnum('kind').notNull(),
    /** The share of the common parts, kept as the fraction it is written as in the deed. */
    shareNumerator: integer('share_numerator').notNull(),
    shareDenominator: integer('share_denominator').notNull(),
    floorArea: numeric('floor_area', { precision: 8, scale: 2 }).notNull(),
  },
  (table) => [
    uniqueIndex('unit_number_unique').on(table.tenantId, table.svjId, table.number),
    index('unit_building_idx').on(table.tenantId, table.buildingId),
  ],
);

/**
 * A department belongs to the management company, not to an SVJ (task 007 §1) — údržba, finance,
 * úklid, technici, správa. `code` is the stable key the seed upserts by; `name` is what people read.
 */
export const department = tenantTable(
  'department',
  {
    code: text('code').notNull(),
    name: text('name').notNull(),
  },
  (table) => [uniqueIndex('department_code_unique').on(table.tenantId, table.code)],
);
