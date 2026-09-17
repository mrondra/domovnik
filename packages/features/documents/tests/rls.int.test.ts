import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { withTenant } from '../../../kernel/src/db/index';
import { newRowId } from '../../../kernel/src/ids/index';
import { startTestDb, type TestDatabase } from '../../../kernel/src/testing/index';
import { document } from '../schema';
import { featureSchema, withTestTenant, type TestTenant } from './documents.fixture';

let database: TestDatabase;
let first: TestTenant;
let second: TestTenant;

beforeAll(async () => {
  database = await startTestDb(featureSchema);
  first = await withTestTenant('A');
  second = await withTestTenant('B');
}, 120_000);

afterAll(async () => {
  await database.stop();
});

const MARK = 'značka prvního správce';

const insert = (tenant: TestTenant, tenantId: string): Promise<void> =>
  withTenant(tenant.ctx, async (tx) => {
    await tx.insert(document).values({
      id: newRowId(),
      tenantId,
      svjId: newRowId(),
      title: MARK,
      category: 'invoice',
      storageKey: `tenants/${tenantId}/documents/${newRowId()}.pdf`,
      sha256: newRowId().replaceAll('-', '').repeat(2),
    });
  });

const marked = (tenant: TestTenant): Promise<number> =>
  withTenant(
    tenant.ctx,
    async (tx) => (await tx.select().from(document).where(eq(document.title, MARK))).length,
  );

describe('document isolation', () => {
  it('hides rows of another tenant', async () => {
    await insert(first, first.tenantId);

    expect(await marked(second)).toBe(0);
    expect(await marked(first)).toBeGreaterThan(0);
  });

  it('rejects a write carrying a foreign tenant_id', async () => {
    await expect(insert(first, second.tenantId)).rejects.toThrow();
  });
});
