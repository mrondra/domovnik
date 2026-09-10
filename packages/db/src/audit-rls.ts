import { sql } from 'drizzle-orm';
import { withSystem } from '../../kernel/src/db/index';

/**
 * Reads the catalogue rather than the registry on purpose: it answers what the database actually
 * enforces, so it also catches a table nobody created through `tenantTable()` (ADR 0003).
 */
const UNPROTECTED = sql`
  SELECT c.relname AS tablename
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'tenant_id' AND a.attnum > 0 AND NOT a.attisdropped
  WHERE c.relkind = 'r'
    AND n.nspname = 'public'
    AND (
      NOT c.relrowsecurity
      OR NOT c.relforcerowsecurity
      OR NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = n.nspname AND p.tablename = c.relname)
    )
  ORDER BY c.relname`;

export const tablesWithoutRls = async (): Promise<readonly string[]> =>
  withSystem({ reason: 'row level security audit' }, async (tx) => {
    const result = await tx.execute<{ tablename: string }>(UNPROTECTED);
    return result.rows.map((row) => row.tablename);
  });
