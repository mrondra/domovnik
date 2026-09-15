import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { approvals } from '../../../../packages/kernel/src/approvals/index';
import { audit } from '../../../../packages/kernel/src/audit/index';
import { withTenant } from '../../../../packages/kernel/src/db/index';
import { auditVia, type McpPrincipal } from './principal';

const MIME = 'application/json';

const APPROVALS_INBOX = 'approvals://inbox';
const SVJ_LIST = 'svj://list';

const asJson = (uri: string, payload: unknown): ReadResourceResult => ({
  contents: [{ uri, mimeType: MIME, text: JSON.stringify(payload) }],
});

const record = (principal: McpPrincipal, uri: string): Promise<void> =>
  withTenant(principal.ctx, () =>
    audit.record(principal.ctx, {
      action: 'resource.read',
      entity: 'resource',
      reason: `Čtení ${uri} přes MCP`,
      via: auditVia(principal),
    }),
  );

/**
 * Read-only context for the model (zadání kap. 9). It goes through the same service as the UI, so
 * the inbox holds exactly what this person would be allowed to decide — no separate visibility rule.
 *
 * `svj://list` answers empty until the `svj` feature exists; a resource the client can see and that
 * returns nothing is honest, and an absent resource would look like a protocol difference.
 */
export const registerResources = (server: McpServer, principal: McpPrincipal): readonly string[] => {
  server.registerResource(
    'approvals-inbox',
    APPROVALS_INBOX,
    { description: 'Co čeká na rozhodnutí přihlášeného uživatele.', mimeType: MIME },
    async () => {
      await record(principal, APPROVALS_INBOX);
      return asJson(APPROVALS_INBOX, await approvals.list(principal.ctx));
    },
  );

  server.registerResource(
    'svj-list',
    SVJ_LIST,
    { description: 'SVJ dostupná v rozsahu tokenu.', mimeType: MIME },
    async () => {
      await record(principal, SVJ_LIST);
      return asJson(SVJ_LIST, { svj: [], scope: principal.svjScope });
    },
  );

  return [APPROVALS_INBOX, SVJ_LIST];
};
