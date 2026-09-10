import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auditLog } from '../db/schema/index';
import { withTenant } from '../db/tenant';
import { startTestDb, withTestTenant, type TestDatabase, type TestTenant } from '../testing/index';
import { audit } from './index';

let database: TestDatabase;
let tenant: TestTenant;

beforeAll(async () => {
  database = await startTestDb();
  tenant = await withTestTenant();
}, 120_000);

afterAll(async () => {
  await database.stop();
});

describe('audit', () => {
  it('records the actor and the reason inside the caller transaction', async () => {
    await withTenant(tenant.ctx, async () => {
      await audit.record(tenant.ctx, {
        action: 'invoice.approved',
        entity: 'invoice',
        reason: 'V rozpočtu',
        after: { status: 'approved' },
      });
    });

    const rows = await withTenant(tenant.ctx, (tx) =>
      tx.select().from(auditLog).where(eq(auditLog.action, 'invoice.approved')),
    );
    expect(rows[0]?.reason).toBe('V rozpočtu');
    expect(rows[0]?.actorId).toBe(tenant.adminId);
  });

  it('refuses to record outside a transaction', async () => {
    await expect(audit.record(tenant.ctx, { action: 'x', entity: 'y', reason: 'z' })).rejects.toThrow(
      /uvnitř withTenant/,
    );
  });
});
