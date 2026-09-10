import { Client } from 'pg';

/**
 * DDL that the ORM does not express: extensions, roles, grants and the generated RLS policies.
 * Used by test provisioning and, from task 003 on, by the migration runner.
 */
export const runSql = async (connectionString: string, statements: readonly string[]): Promise<void> => {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    for (const statement of statements) {
      await client.query(statement);
    }
  } finally {
    await client.end();
  }
};

export const withDatabaseName = (connectionString: string, database: string): string => {
  const url = new URL(connectionString);
  url.pathname = `/${database}`;
  return url.toString();
};

export const withCredentials = (connectionString: string, user: string, password: string): string => {
  const url = new URL(connectionString);
  url.username = user;
  url.password = password;
  return url.toString();
};
