import { describe, expect, it } from 'vitest';
import { text } from 'drizzle-orm/pg-core';
import { registeredTables, rlsPoliciesSql, svjTable } from './table';
import './schema/index';

describe('tenantTable', () => {
  it('registers every kernel table for policy generation', () => {
    const names = registeredTables().map((table) => table.name);
    expect(names).toContain('approval');
    expect(names).toContain('audit_log');
    expect(names).toContain('event_outbox');
  });
});

describe('svjTable', () => {
  const inspection = svjTable('probe_inspection', { kind: text('kind').notNull() });

  it('adds the svj column next to the tenant column', () => {
    expect(Object.keys(inspection)).toEqual(
      expect.arrayContaining(['id', 'tenantId', 'svjId', 'kind', 'createdAt']),
    );
  });

  it('registers itself with the svj scope', () => {
    expect(registeredTables().find((table) => table.name === 'probe_inspection')?.scope).toBe('svj');
  });
});

describe('rlsPoliciesSql', () => {
  const statements = rlsPoliciesSql([{ name: 'invoice', scope: 'tenant' }]);

  it('enables and forces row level security', () => {
    expect(statements).toContain('ALTER TABLE "invoice" ENABLE ROW LEVEL SECURITY');
    expect(statements).toContain('ALTER TABLE "invoice" FORCE ROW LEVEL SECURITY');
  });

  it('guards both reads and writes with the session tenant', () => {
    const policy = statements.find((statement) => statement.startsWith('CREATE POLICY'));
    expect(policy).toContain(`USING (tenant_id = current_setting('app.tenant_id')::uuid)`);
    expect(policy).toContain(`WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid)`);
  });

  it('is repeatable', () => {
    expect(statements).toContain('DROP POLICY IF EXISTS "invoice_tenant_isolation" ON "invoice"');
  });
});
