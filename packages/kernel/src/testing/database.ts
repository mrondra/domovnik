import { randomBytes } from 'node:crypto';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { getTableName, is, Table } from 'drizzle-orm';
import { pushSchema } from 'drizzle-kit/api';
import { runSql, withCredentials, withDatabaseName } from '../db/admin';
import { administrativeDb, closeConnections } from '../db/client';
import * as schema from '../db/schema/index';
import { registeredTables, rlsPoliciesSql } from '../db/table';
import { applyTestEnv } from './env';

/**
 * `drizzle-kit/api` assigns `Array.prototype.random` on import, and an enumerable property on
 * `Array.prototype` is something other libraries refuse to run next to — pdfjs, which `pdf-parse`
 * is built on, throws on load rather than let `for...in` over an array misbehave. Hiding it keeps
 * the function drizzle-kit calls and takes it out of everybody else's way.
 */
if (Object.prototype.propertyIsEnumerable.call(Array.prototype, 'random')) {
  Object.defineProperty(Array.prototype, 'random', { enumerable: false });
}

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
 * The table registry is global and fills up as modules are imported, so a test that happens to pull
 * a feature barrel in would otherwise ask for policies on tables this database never got.
 */
const pushedTableNames = (modules: Readonly<Record<string, unknown>>): ReadonlySet<string> =>
  new Set(Object.values(modules).flatMap((value) => (is(value, Table) ? [getTableName(value)] : [])));

/**
 * A fresh database per test file, plus a dedicated non-superuser role: RLS is bypassed for
 * superusers, so an isolation test connected as the owner would pass without proving anything.
 *
 * `featureSchema` carries the tables of the feature under test (`startTestDb({ demoRecord })`);
 * the kernel schema is always pushed, and every table pushed here gets its RLS policy from the
 * registry regardless of which package declared it.
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

  const pushed = { ...schema, ...featureSchema };
  const push = await pushSchema(pushed, administrativeDb());
  await push.apply();

  const present = pushedTableNames(pushed);
  await runSql(adminUrl, [
    ...rlsPoliciesSql(registeredTables().filter((table) => present.has(table.name))),
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
