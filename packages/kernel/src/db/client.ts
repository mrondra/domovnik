import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { adminDatabaseUrl, loadEnv } from '../env/index';

export type Database = NodePgDatabase;

/** The transaction handle drizzle hands to `db.transaction(cb)`. */
export type TenantTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];

interface Connection {
  readonly pool: Pool;
  readonly db: Database;
}

let application: Connection | undefined;
let administrative: Connection | undefined;

const connect = (connectionString: string): Connection => {
  const pool = new Pool({ connectionString });
  return { pool, db: drizzle(pool) };
};

/** Not exported from the package index: everything outside `db/` goes through `withTenant`. */
export const applicationDb = (): Database => {
  application ??= connect(loadEnv().DATABASE_URL);
  return application.db;
};

export const administrativeDb = (): Database => {
  administrative ??= connect(adminDatabaseUrl(loadEnv()));
  return administrative.db;
};

export const closeConnections = async (): Promise<void> => {
  const pools = [application?.pool, administrative?.pool].filter((pool) => pool !== undefined);
  application = undefined;
  administrative = undefined;
  await Promise.all(pools.map((pool) => pool.end()));
};
