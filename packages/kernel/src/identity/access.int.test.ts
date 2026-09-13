import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { clearTools, defineTool } from '../tools/registry/index';
import { startTestDb, withTestTenant, type TestDatabase, type TestTenant } from '../testing/index';
import {
  createApiToken,
  createSession,
  ensureAgentIdentity,
  revokeApiToken,
  revokeSession,
  verifyApiToken,
  verifySession,
} from './service/index';

let database: TestDatabase;
let tenant: TestTenant;

beforeAll(async () => {
  database = await startTestDb();
  tenant = await withTestTenant();
  clearTools();
  defineTool({
    name: 'invoice.get',
    description: 'Vrátí fakturu.',
    input: z.object({}),
    output: z.object({}),
    permission: 'finance.read',
    approval: () => ({ required: false, approvers: [] }),
    userComposable: true,
    readOnly: true,
    handler: () => Promise.resolve({}),
  });
}, 120_000);

afterAll(async () => {
  await database.stop();
});

describe('sessions', () => {
  it('verifies an issued session and stops verifying a revoked one', async () => {
    const { token } = await createSession(tenant.ctx, tenant.adminId);

    expect((await verifySession(token)).userId).toBe(tenant.adminId);

    await revokeSession(tenant.ctx, token);
    await expect(verifySession(token)).rejects.toThrow(/Neplatná relace/);
  });

  it('rejects an expired session', async () => {
    const { token } = await createSession(tenant.ctx, tenant.adminId, -1);
    await expect(verifySession(token)).rejects.toThrow(/Neplatná relace/);
  });
});

describe('api tokens', () => {
  it('returns the secret once and stores only its hash', async () => {
    const issued = await createApiToken(tenant.ctx, {
      name: 'MCP',
      ownerUserId: tenant.adminId,
      allowedTools: ['invoice.get'],
    });

    const grant = await verifyApiToken(issued.token);
    expect(grant.allowedTools).toEqual(['invoice.get']);
    expect(grant.svjScope).toBeNull();

    await revokeApiToken(tenant.ctx, issued.id);
    await expect(verifyApiToken(issued.token)).rejects.toThrow(/Neplatný API token/);
  });

  it('rejects a token that has expired', async () => {
    const issued = await createApiToken(tenant.ctx, {
      name: 'Starý',
      ownerUserId: tenant.adminId,
      allowedTools: [],
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(verifyApiToken(issued.token)).rejects.toThrow(/Neplatný API token/);
  });
});

describe('agent identity', () => {
  it('is created once per name and version', async () => {
    const first = await ensureAgentIdentity(tenant.ctx, {
      agentName: 'invoice-processor',
      version: '1.0.0',
      roles: ['finance'],
    });
    const again = await ensureAgentIdentity(tenant.ctx, {
      agentName: 'invoice-processor',
      version: '1.0.0',
      roles: ['finance'],
    });
    expect(again).toBe(first);
  });
});
