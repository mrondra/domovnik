import { randomBytes } from 'node:crypto';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { runSql, withCredentials, withDatabaseName } from '../../kernel/src/db/admin';
import { closeConnections } from '../../kernel/src/db/index';
import { applyTestEnv } from '../../kernel/src/testing/index';
import { runMigrations } from './migrate';

const PGVECTOR_IMAGE = 'pgvector/pgvector:pg16';
const APP_PASSWORD = 'test';

export interface MigratedDatabase {
  readonly adminUrl: string;
  stop(): Promise<void>;
}

interface Cluster {
  readonly url: string;
  stop(): Promise<void>;
}

/** Mirrors `startTestDb`, except the schema arrives through the migrations instead of a push. */
const startCluster = async (): Promise<Cluster> => {
  const provided = process.env['DATABASE_URL'];
  if (provided !== undefined) return { url: provided, stop: () => Promise.resolve() };

  const started: StartedPostgreSqlContainer = await new PostgreSqlContainer(PGVECTOR_IMAGE).start();
  return {
    url: started.getConnectionUri(),
    stop: async () => {
      await started.stop();
    },
  };
};

/**
 * A database per test file with a dedicated non-superuser application role (ADR 0013), built by
 * `runMigrations()` — this is the only place that proves the committed migrations actually apply.
 */
export const startMigratedDb = async (): Promise<MigratedDatabase> => {
  const cluster = await startCluster();
  const suffix = randomBytes(6).toString('hex');
  const database = `domovnik_db_test_${suffix}`;
  const role = `domovnik_app_${suffix}`;

  await runSql(cluster.url, [`CREATE DATABASE "${database}"`]);
  const adminUrl = withDatabaseName(cluster.url, database);
  const appUrl = withCredentials(adminUrl, role, APP_PASSWORD);

  await runSql(adminUrl, [
    `CREATE ROLE "${role}" LOGIN PASSWORD '${APP_PASSWORD}'`,
    `GRANT USAGE ON SCHEMA public TO "${role}"`,
  ]);

  await closeConnections();
  applyTestEnv({ DATABASE_URL: appUrl, DATABASE_ADMIN_URL: adminUrl });
  await runMigrations();
  await runSql(adminUrl, [
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "${role}"`,
  ]);

  return {
    adminUrl,
    stop: async () => {
      await closeConnections();
      await runSql(cluster.url, [`DROP DATABASE IF EXISTS "${database}"`, `DROP ROLE IF EXISTS "${role}"`]);
      await cluster.stop();
    },
  };
};
