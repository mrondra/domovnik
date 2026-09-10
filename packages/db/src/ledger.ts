import { sql } from 'drizzle-orm';
import type { TenantTransaction } from '../../kernel/src/db/index';

/** The table Drizzle's own migrator keeps, so the two implementations stay interchangeable. */
const LEDGER = sql`"drizzle"."__drizzle_migrations"`;

export const ensureLedger = async (tx: TenantTransaction): Promise<void> => {
  await tx.execute(sql`CREATE SCHEMA IF NOT EXISTS "drizzle"`);
  await tx.execute(
    sql`CREATE TABLE IF NOT EXISTS ${LEDGER} ("id" serial PRIMARY KEY, "hash" text NOT NULL, "created_at" bigint)`,
  );
};

export const appliedHashes = async (tx: TenantTransaction): Promise<ReadonlySet<string>> => {
  const result = await tx.execute<{ hash: string }>(sql`SELECT "hash" FROM ${LEDGER}`);
  return new Set(result.rows.map((row) => row.hash));
};

export const recordApplied = async (
  tx: TenantTransaction,
  hash: string,
  folderMillis: number,
): Promise<void> => {
  await tx.execute(sql`INSERT INTO ${LEDGER} ("hash", "created_at") VALUES (${hash}, ${folderMillis})`);
};
