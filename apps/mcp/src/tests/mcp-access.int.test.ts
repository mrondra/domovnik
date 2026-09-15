import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { revokeApiToken } from '../../../../packages/kernel/src/identity/index';
import { auditRowsFor, connect, startHarness } from './mcp.fixture';
import type { McpHarness } from './mcp.fixture';
import { READ_TOOL, resourcePayloadOf } from './tools.fixture';

const INVOICE_ID = '8f14e45f-ceea-467a-9f30-1b0e0b0e0001';

let mcp: McpHarness;

beforeAll(async () => {
  mcp = await startHarness();
}, 180_000);

afterAll(async () => {
  await mcp.stop();
});

describe('the audit trail', () => {
  it('names the token every call came through', async () => {
    const client = await connect(mcp.url, mcp.readOnly.token);
    await client.callTool({ name: 'invoice_get', arguments: { invoiceId: INVOICE_ID } });
    await client.close();

    const rows = await auditRowsFor(mcp.tenant, `tool.${READ_TOOL}`);
    expect(rows.map((row) => row.via)).toContain(`api_token:${mcp.readOnly.id}`);
    expect(rows.every((row) => row.actorType === 'user')).toBe(true);
  });

  it('records a resource read as well', async () => {
    const client = await connect(mcp.url, mcp.readOnly.token);
    await client.readResource({ uri: 'approvals://inbox' });
    await client.close();

    const rows = await auditRowsFor(mcp.tenant, 'resource.read');
    expect(rows.map((row) => row.via)).toContain(`api_token:${mcp.readOnly.id}`);
  });
});

describe('resources', () => {
  it('serves the approvals inbox and an empty svj list', async () => {
    const client = await connect(mcp.url, mcp.full.token);

    const inbox = await client.readResource({ uri: 'approvals://inbox' });
    const svj = await client.readResource({ uri: 'svj://list' });

    expect(resourcePayloadOf(inbox)).toBeInstanceOf(Array);
    expect(resourcePayloadOf(svj)).toMatchObject({ svj: [] });
    await client.close();
  });
});

describe('a credential that does not hold', () => {
  it('refuses a connection without a token', async () => {
    await expect(connect(mcp.url, '')).rejects.toThrow();
  });

  it('refuses a revoked token', async () => {
    const revoked = await mcp.issue('k odvolání', [READ_TOOL]);
    await revokeApiToken(mcp.tenant.ctx, revoked.id);

    await expect(connect(mcp.url, revoked.token)).rejects.toThrow();
  });
});
