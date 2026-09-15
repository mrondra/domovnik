import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { audit } from '../../../../packages/kernel/src/audit/index';
import { withTenant } from '../../../../packages/kernel/src/db/index';
import { toToolErrorResult } from '../../../../packages/kernel/src/errors/index';
import { logger } from '../../../../packages/kernel/src/logger/index';
import {
  executeTool,
  mcpToolName,
  toolInputShape,
  type RegisteredTool,
} from '../../../../packages/kernel/src/tools/index';
import { auditVia, toolsFor, type McpPrincipal } from './principal';

const asText = (payload: unknown): CallToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(payload) }],
});

const asFailure = (payload: unknown): CallToolResult => ({ ...asText(payload), isError: true });

/** An approval is an answer, not a failure — the model is told what is pending and why. */
const pending = (tool: RegisteredTool, approvalId: string): CallToolResult =>
  asText({
    status: 'pending_approval',
    approvalId,
    message: `Akce ${tool.name} vyžaduje schválení. Po rozhodnutí ji provede Domovník sám.`,
  });

const record = (principal: McpPrincipal, toolName: string): Promise<void> =>
  withTenant(principal.ctx, () =>
    audit.record(principal.ctx, {
      action: `tool.${toolName}`,
      entity: 'tool',
      reason: 'Volání přes MCP',
      via: auditVia(principal),
    }),
  );

const call = async (
  principal: McpPrincipal,
  tool: RegisteredTool,
  args: unknown,
): Promise<CallToolResult> => {
  await record(principal, tool.name);
  try {
    const execution = await executeTool(principal.ctx, tool.name, args);
    return execution.status === 'pending_approval'
      ? pending(tool, execution.approvalId)
      : asText({ status: 'ok', output: execution.output });
  } catch (error) {
    logger().warn({ tool: tool.name, error }, 'MCP tool call failed');
    return asFailure(toToolErrorResult(error));
  }
};

/**
 * Only the tools this token may use are registered at all, so a tool outside the token is not
 * refused on call — it is not in `tools/list` and does not exist for this connection.
 */
export const registerTools = (server: McpServer, principal: McpPrincipal): readonly string[] => {
  const tools = toolsFor(principal);

  for (const tool of tools) {
    server.registerTool(
      mcpToolName(tool.name),
      {
        description: tool.description,
        inputSchema: toolInputShape(tool),
        annotations: { readOnlyHint: tool.readOnly },
      },
      (args: unknown) => call(principal, tool, args),
    );
  }

  return tools.map((tool) => mcpToolName(tool.name));
};
