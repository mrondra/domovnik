import type { BuildColumns, BuildExtraConfigColumns } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  uuid,
  type PgColumnBuilderBase,
  type PgTableExtraConfigValue,
  type PgTableWithColumns,
} from 'drizzle-orm/pg-core';

export type TableScope = 'tenant' | 'svj';

export interface TableMetadata {
  readonly name: string;
  readonly scope: TableScope;
}

const registry = new Map<string, TableMetadata>();

const auditColumns = {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by'),
};

type AuditColumns = typeof auditColumns;

/** Flattens the intersection: `pgTable` infers only one constituent of an intersection argument. */
type Columns<C> = { [K in keyof (AuditColumns & C)]: (AuditColumns & C)[K] };
interface SvjColumn {
  svjId: ReturnType<ReturnType<typeof uuid>['notNull']>;
}

type Extras<M extends Record<string, PgColumnBuilderBase>> = (
  self: BuildExtraConfigColumns<string, M, 'pg'>,
) => PgTableExtraConfigValue[];

type Built<M extends Record<string, PgColumnBuilderBase>> = PgTableWithColumns<{
  name: string;
  schema: undefined;
  columns: BuildColumns<string, M, 'pg'>;
  dialect: 'pg';
}>;

/** Every tenant-scoped table goes through here, which is what guarantees an RLS policy exists. */
export const tenantTable = <C extends Record<string, PgColumnBuilderBase>>(
  name: string,
  columns: C,
  extras?: Extras<Columns<C>>,
): Built<Columns<C>> => {
  registry.set(name, { name, scope: 'tenant' });
  const merged: Columns<C> = { ...auditColumns, ...columns };
  return pgTable(name, merged, extras);
};

export const svjTable = <C extends Record<string, PgColumnBuilderBase>>(
  name: string,
  columns: C,
  extras?: Extras<Columns<SvjColumn & C>>,
): Built<Columns<SvjColumn & C>> => {
  registry.set(name, { name, scope: 'svj' });
  const merged: Columns<SvjColumn & C> = {
    ...auditColumns,
    svjId: uuid('svj_id').notNull(),
    ...columns,
  };
  return pgTable(name, merged, extras);
};

export const registeredTables = (): readonly TableMetadata[] => [...registry.values()];

const policyName = (table: string): string => `${table}_tenant_isolation`;

const TENANT_PREDICATE = "tenant_id = current_setting('app.tenant_id')::uuid";

/**
 * `FORCE` makes the policy apply to the table owner too, and the non-`missing_ok` `current_setting`
 * turns any query issued outside `withTenant` into a loud error instead of an empty result.
 */
export const rlsPoliciesSql = (tables: readonly TableMetadata[] = registeredTables()): readonly string[] =>
  tables.flatMap((table) => [
    `ALTER TABLE "${table.name}" ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE "${table.name}" FORCE ROW LEVEL SECURITY`,
    `DROP POLICY IF EXISTS "${policyName(table.name)}" ON "${table.name}"`,
    `CREATE POLICY "${policyName(table.name)}" ON "${table.name}" FOR ALL` +
      ` USING (${TENANT_PREDICATE}) WITH CHECK (${TENANT_PREDICATE})`,
  ]);
