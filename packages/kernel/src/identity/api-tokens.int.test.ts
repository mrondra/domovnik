import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { clearTools, defineTool } from '../tools/registry/index';
import { startTestDb, withTestTenant, type TestDatabase, type TestTenant } from '../testing/index';
import { createApiToken, createUser, listApiTokens, revokeApiToken } from './service/index';

let database: TestDatabase;
let tenant: TestTenant;

const tool = (name: string, permission: string) =>
  defineTool({
    name,
    description: `Nástroj ${name}.`,
    input: z.object({}),
    output: z.object({}),
    permission,
    approval: () => ({ required: false, approvers: [] }),
    userComposable: true,
    readOnly: true,
    handler: () => Promise.resolve({}),
  });

beforeAll(async () => {
  database = await startTestDb();
  tenant = await withTestTenant();
  clearTools();
  tool('invoice.get', 'finance.read');
  tool('inspection.close', 'ops.inspection.close');
}, 120_000);

afterAll(async () => {
  await database.stop();
});

describe('createApiToken', () => {
  it('refuses a tool the owner may not use', async () => {
    const financeId = await createUser(tenant.ctx, {
      email: 'tokens-finance@example.test',
      displayName: 'Finance',
      password: 'heslo-12345',
      roles: ['finance'],
    });

    await expect(
      createApiToken(tenant.ctx, {
        name: 'Příliš mocný',
        ownerUserId: financeId,
        allowedTools: ['invoice.get', 'inspection.close'],
      }),
    ).rejects.toThrow(/víc oprávnění než jeho vlastník/);
  });

  it('refuses a tool that is not in the registry at all', async () => {
    await expect(
      createApiToken(tenant.ctx, {
        name: 'Vymyšlený',
        ownerUserId: tenant.adminId,
        allowedTools: ['invoice.vymyslene'],
      }),
    ).rejects.toThrow(/víc oprávnění než jeho vlastník/);
  });
});

describe('listApiTokens', () => {
  it('lists a token without its plaintext and shows it as revoked afterwards', async () => {
    const issued = await createApiToken(tenant.ctx, {
      name: 'MCP pro výbor',
      ownerUserId: tenant.adminId,
      allowedTools: ['invoice.get'],
    });

    const listed = (await listApiTokens(tenant.ctx)).find((row) => row.id === issued.id);
    expect(listed?.name).toBe('MCP pro výbor');
    expect(listed?.revokedAt).toBeNull();
    expect(JSON.stringify(listed)).not.toContain(issued.token);

    await revokeApiToken(tenant.ctx, issued.id);
    const after = (await listApiTokens(tenant.ctx)).find((row) => row.id === issued.id);
    expect(after?.revokedAt).not.toBeNull();
  });

  it('does not leak tokens of another tenant', async () => {
    const other = await withTestTenant('Jiný správce');
    await createApiToken(other.ctx, {
      name: 'Cizí',
      ownerUserId: other.adminId,
      allowedTools: ['invoice.get'],
    });

    expect((await listApiTokens(tenant.ctx)).map((row) => row.name)).not.toContain('Cizí');
  });
});
