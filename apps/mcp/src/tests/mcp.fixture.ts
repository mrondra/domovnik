import { once } from 'node:events';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { withTenant } from '../../../../packages/kernel/src/db/index';
import { auditLog } from '../../../../packages/kernel/src/db/schema/index';
import { createApiToken, type IssuedApiToken } from '../../../../packages/kernel/src/identity/index';
import { startTestDb, withTestTenant, type TestTenant } from '../../../../packages/kernel/src/testing/index';
import { startMcpServer } from '../http/server';
import { PAY_TOOL, READ_TOOL, registerTools } from './tools.fixture';

export interface McpHarness {
  readonly url: string;
  readonly tenant: TestTenant;
  readonly readOnly: IssuedApiToken;
  readonly full: IssuedApiToken;
  issue(name: string, tools: readonly string[]): Promise<IssuedApiToken>;
  stop(): Promise<void>;
}

export interface AuditRow {
  readonly via: string | null;
  readonly actorType: string;
}

export const connect = async (url: string, token: string): Promise<Client> => {
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: { headers: { authorization: `Bearer ${token}` } },
  });
  // @ts-expect-error The SDK types Transport's optional members as `T | undefined`, which
  // exactOptionalPropertyTypes rejects; the runtime contract is unaffected.
  await client.connect(transport);
  return client;
};

export const toolNames = async (client: Client): Promise<string[]> =>
  (await client.listTools()).tools.map((tool) => tool.name);

export const auditRowsFor = (tenant: TestTenant, action: string): Promise<AuditRow[]> =>
  withTenant(tenant.ctx, (tx) =>
    tx
      .select({ via: auditLog.via, actorType: auditLog.actorType })
      .from(auditLog)
      .where(eq(auditLog.action, action)),
  );

/** One database, one server, two tokens — every test here needs the same stage. */
export const startHarness = async (): Promise<McpHarness> => {
  const database = await startTestDb();
  const tenant = await withTestTenant();
  registerTools();

  // Port 0, because a test needing a free port to be free is a test that fails on a busy machine.
  const server = startMcpServer(0);
  await once(server, 'listening');
  const { port } = z.object({ port: z.number() }).parse(server.address());

  const issue = (name: string, tools: readonly string[]): Promise<IssuedApiToken> =>
    createApiToken(tenant.ctx, { name, ownerUserId: tenant.adminId, allowedTools: tools });

  return {
    url: `http://127.0.0.1:${String(port)}/mcp`,
    tenant,
    readOnly: await issue('jen čtení', [READ_TOOL]),
    full: await issue('správce', [READ_TOOL, PAY_TOOL]),
    issue,
    stop: async () => {
      server.close();
      await once(server, 'close');
      await database.stop();
    },
  };
};
