import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createContext } from '../context/index';
import { newRowId } from '../ids/index';
import { startTestDb, withTestTenant, type TestDatabase } from '../testing/index';
import { applicationDb } from './client';
import { approval } from './schema/index';
import { withTenant } from './tenant';

let database: TestDatabase;

beforeAll(async () => {
  database = await startTestDb();
}, 120_000);

afterAll(async () => {
  await database.stop();
});

const insertApproval = async (tenantId: string, toolName: string, overrideTenant?: string) => {
  const ctx = createContext({
    tenantId: tenantId as never,
    actor: { type: 'system', id: null, roles: [] },
  });
  return withTenant(ctx, async (tx) => {
    await tx.insert(approval).values({
      id: newRowId(),
      tenantId: overrideTenant ?? tenantId,
      toolName,
      input: {},
      evidence: {},
      approvers: [],
    });
  });
};

describe('withTenant', () => {
  it('hides rows of another tenant', async () => {
    const a = await withTestTenant('A');
    const b = await withTestTenant('B');
    await insertApproval(a.tenantId, 'a.tool');

    const seenByB = await withTenant(b.ctx, (tx) =>
      tx.select().from(approval).where(eq(approval.toolName, 'a.tool')),
    );
    const seenByA = await withTenant(a.ctx, (tx) =>
      tx.select().from(approval).where(eq(approval.toolName, 'a.tool')),
    );

    expect(seenByB).toHaveLength(0);
    expect(seenByA).toHaveLength(1);
  });

  it('rejects a write carrying a foreign tenant_id', async () => {
    const a = await withTestTenant('A');
    const b = await withTestTenant('B');
    await expect(insertApproval(a.tenantId, 'smuggled', b.tenantId)).rejects.toThrow();
  });

  // The policy reads `app.tenant_id` without `missing_ok`, so a query with no session context
  // fails on the setting itself rather than quietly returning nothing.
  it('rejects a query issued outside the wrapper', async () => {
    await expect(applicationDb().select().from(approval)).rejects.toThrow();
  });

  it('reuses the open transaction for a nested call with the same tenant', async () => {
    const a = await withTestTenant('A');
    const nested = await withTenant(a.ctx, (outer) =>
      withTenant(a.ctx, (inner) => Promise.resolve(inner === outer)),
    );
    expect(nested).toBe(true);
  });

  it('rejects a nested call that switches tenant', async () => {
    const a = await withTestTenant('A');
    const b = await withTestTenant('B');
    await expect(
      withTenant(a.ctx, () => withTenant(b.ctx, () => Promise.resolve(undefined))),
    ).rejects.toThrow(/přepnout tenanta/);
  });
});
