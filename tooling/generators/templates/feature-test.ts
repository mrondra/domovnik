import type { Names } from '../lib/names';

export const rlsIntTest = (names: Names): string => `import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { withTenant } from '../../../kernel/src/db/index';
import { newRowId } from '../../../kernel/src/ids/index';
import {
  startTestDb,
  withTestTenant,
  type TestDatabase,
  type TestTenant,
} from '../../../kernel/src/testing/index';
import { ${names.camel}Record } from '../schema';

const TITLE = 'záznam prvního správce';

let database: TestDatabase;

beforeAll(async () => {
  database = await startTestDb({ ${names.camel}Record });
}, 120_000);

afterAll(async () => {
  await database.stop();
});

const insertRecord = (tenant: TestTenant, tenantId: string, title: string): Promise<void> =>
  withTenant(tenant.ctx, async (tx) => {
    await tx.insert(${names.camel}Record).values({ id: newRowId(), tenantId, svjId: newRowId(), title });
  });

const titled = (tenant: TestTenant, title: string): Promise<readonly unknown[]> =>
  withTenant(tenant.ctx, (tx) =>
    tx.select().from(${names.camel}Record).where(eq(${names.camel}Record.title, title)),
  );

describe('${names.snake}_record isolation', () => {
  it('hides rows of another tenant', async () => {
    const first = await withTestTenant('A');
    const second = await withTestTenant('B');
    await insertRecord(first, first.tenantId, TITLE);

    expect(await titled(second, TITLE)).toHaveLength(0);
    expect(await titled(first, TITLE)).toHaveLength(1);
  });

  it('rejects a write carrying a foreign tenant_id', async () => {
    const first = await withTestTenant('A');
    const second = await withTestTenant('B');

    await expect(insertRecord(first, second.tenantId, 'propašovaný záznam')).rejects.toThrow();
  });
});
`;
