import { describe, expect, it } from 'vitest';
import { createdTables, decorateMigration } from './decorate';

const CREATE_TENANT = 'CREATE TABLE "tenant" (\n\t"id" uuid PRIMARY KEY NOT NULL\n);';

describe('decorateMigration', () => {
  it('puts the pgvector extension first', () => {
    expect(decorateMigration(CREATE_TENANT).startsWith('CREATE EXTENSION IF NOT EXISTS vector;')).toBe(true);
  });

  it('appends a forced policy for a table from the registry', () => {
    const decorated = decorateMigration(CREATE_TENANT);
    expect(decorated).toContain('ALTER TABLE "tenant" FORCE ROW LEVEL SECURITY;');
    expect(decorated).toContain('CREATE POLICY "tenant_tenant_isolation" ON "tenant" FOR ALL');
  });

  it('leaves a table nobody registered without a policy', () => {
    expect(decorateMigration('CREATE TABLE "smuggled" ("id" uuid);')).not.toContain('ROW LEVEL SECURITY');
  });

  it('keeps the original statements', () => {
    expect(decorateMigration(CREATE_TENANT)).toContain(CREATE_TENANT);
  });
});

describe('createdTables', () => {
  it('reads the table names a migration creates', () => {
    const migration = 'CREATE TABLE "a" ();--> statement-breakpoint\nCREATE TABLE IF NOT EXISTS "b" ();';
    expect(createdTables(migration)).toStrictEqual(['a', 'b']);
  });

  it('ignores an ALTER TABLE', () => {
    expect(createdTables('ALTER TABLE "a" ADD COLUMN "x" text;')).toStrictEqual([]);
  });
});
