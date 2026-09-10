import { sql } from 'drizzle-orm';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { withSystem } from '../../kernel/src/db/index';
import { logger } from '../../kernel/src/logger/index';
import { appliedHashes, ensureLedger, recordApplied } from './ledger';
import { migrationsFolder } from './paths';

/**
 * Drizzle's migration reader applied through `withSystem`: DDL needs the owner connection, and
 * `withSystem` is the only route to it (ADR 0013). One transaction covers the whole run, so a
 * failing statement leaves the database on the last complete migration.
 */
export const runMigrations = async (): Promise<number> => {
  const migrations = readMigrationFiles({ migrationsFolder: migrationsFolder() });

  return withSystem({ reason: 'database migration' }, async (tx) => {
    await ensureLedger(tx);
    const applied = await appliedHashes(tx);
    const pending = migrations.filter((migration) => !applied.has(migration.hash));

    for (const migration of pending) {
      for (const statement of migration.sql.filter((candidate) => candidate.trim().length > 0)) {
        await tx.execute(sql.raw(statement));
      }
      await recordApplied(tx, migration.hash, migration.folderMillis);
    }

    logger().info({ applied: pending.length, total: migrations.length }, 'Migrations applied');
    return pending.length;
  });
};
