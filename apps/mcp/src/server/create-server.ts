import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '../../../../packages/kernel/src/logger/index';
import { registerResources } from './resources';
import { registerTools } from './tools';
import type { McpPrincipal } from './principal';

const SERVER_NAME = 'domovnik';
const SERVER_VERSION = '1.0.0';

/**
 * One server per connection, built from the token that opened it: what a client sees in `tools/list`
 * is decided here, once, rather than being filtered on every call (zadání kap. 9).
 */
export const createMcpServer = (principal: McpPrincipal): McpServer => {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  const tools = registerTools(server, principal);
  const resources = registerResources(server, principal);

  logger().debug({ tenantId: principal.ctx.tenantId, tools, resources }, 'MCP session opened');
  return server;
};
