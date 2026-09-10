import { randomBytes } from 'node:crypto';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { pushSchema } from 'drizzle-kit/api';
import { runSql, withCredentials, withDatabaseName } from '../db/admin';
import { administrativeDb, closeConnections } from '../db/client';
import * as schema from '../db/schema/index';
import { rlsPoliciesSql } from '../db/table';
import { applyTestEnv } from './env';

const PGVECTOR_IMAGE = 'pgvector/pgvector:pg16';
const APP_PASSWORD = 'test';

export interface TestDatabase {
  readonly appUrl: string;
  readonly adminUrl: string;
  stop(): Promise<void>;
}

interface BaseCluster {
  readonly url: string;
  stop(): Promise<void>;
}

/** A running Postgres from docker compose or CI is reused; otherwise testcontainers starts one. */
const startCluster = async (): Promise<BaseCluster> => {
  const provided = process.env['DATABASE_URL'];
  if (provided !== undefined) {
    return { url: provided, stop: () => Promise.resolve() };
  }

  const started: StartedPostgreSqlContainer = await new PostgreSqlContainer(PGVECTOR_IMAGE).start();
  return {
    url: started.getConnectionUri(),
    stop: async () => {
      await started.stop();
    },
  };
};

/**
 * A fresh database per test file, plus a dedicated non-superuser role: RLS is bypassed for
 * superusers, so an isolation test connected as the owner would pass without proving anything.
 *
 * `featureSchema` carries the tables of the feature under test (`startTestDb({ demoRecord })`);
 * the kernel schema is always pushed, and every table built by `tenantTable`/`svjTable` gets its
 * RLS policy from the registry regardless of which package declared it.
 */
export const startTestDb = async (featureSchema: Record<string, unknown> = {}): Promise<TestDatabase> => {
  const cluster = await startCluster();
  const suffix = randomBytes(6).toString('hex');
  const database = `domovnik_test_${suffix}`;
  const role = `domovnik_app_${suffix}`;

  await runSql(cluster.url, [`CREATE DATABASE "${database}"`]);
  const adminUrl = withDatabaseName(cluster.url, database);
  const appUrl = withCredentials(adminUrl, role, APP_PASSWORD);

  await runSql(adminUrl, [
    `CREATE ROLE "${role}" LOGIN PASSWORD '${APP_PASSWORD}'`,
    'CREATE EXTENSION IF NOT EXISTS vector',
    `GRANT USAGE ON SCHEMA public TO "${role}"`,
  ]);

  await closeConnections();
  applyTestEnv({ DATABASE_URL: appUrl, DATABASE_ADMIN_URL: adminUrl });

  const push = await pushSchema({ ...schema, ...featureSchema }, administrativeDb());
  await push.apply();

  await runSql(adminUrl, [
    ...rlsPoliciesSql(),
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "${role}"`,
  ]);

  return {
    appUrl,
    adminUrl,
    stop: async () => {
      await closeConnections();
      await runSql(cluster.url, [`DROP DATABASE IF EXISTS "${database}"`, `DROP ROLE IF EXISTS "${role}"`]);
      await cluster.stop();
    },
  };
};
