import { registeredTables, rlsPoliciesSql, type TableMetadata } from '../../kernel/src/db/index';

const BREAKPOINT = '--> statement-breakpoint';
const VECTOR_EXTENSION = 'CREATE EXTENSION IF NOT EXISTS vector;';
const CREATE_TABLE = /CREATE TABLE (?:IF NOT EXISTS )?"([^"]+)"/g;

export const createdTables = (migration: string): readonly string[] =>
  [...migration.matchAll(CREATE_TABLE)].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));

const registeredCreatedTables = (migration: string): readonly TableMetadata[] => {
  const registry = new Map(registeredTables().map((table) => [table.name, table]));
  return createdTables(migration).flatMap((name) => {
    const table = registry.get(name);
    return table === undefined ? [] : [table];
  });
};

/**
 * Drizzle Kit writes plain DDL: it knows nothing about row level security or about pgvector. The
 * generator appends both here, which is what keeps a new table from shipping without its policy
 * (ADR 0003). A table created outside `tenantTable()` is not in the registry and therefore gets
 * nothing — the RLS audit in the integration test is what catches it.
 */
export const decorateMigration = (migration: string): string => {
  const policies = rlsPoliciesSql(registeredCreatedTables(migration)).map((statement) => `${statement};`);
  return `${[VECTOR_EXTENSION, migration.trim(), ...policies].join(`\n${BREAKPOINT}\n`)}\n`;
};
