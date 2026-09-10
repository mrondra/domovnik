import {
  createSdkMcpServer,
  tool,
  type McpSdkServerConfigWithInstance,
} from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import type { RequestContext } from '../../context/index';
import { toToolErrorResult } from '../../errors/http';
import { DomainError } from '../../errors/index';
import { logger } from '../../logger/index';
import { executeTool } from '../../tools/execute';
import { getTools, type RegisteredTool } from '../../tools/registry/index';
import { assertAutonomyAllows, toolsForAutonomy } from '../autonomy';
import type { AgentDefinition, Autonomy } from '../definition';

export const MCP_SERVER_NAME = 'domovnik';

/** MCP tool names allow no dots; `invoice.extract` becomes `invoice_extract` on the wire. */
const mcpToolName = (name: string): string => name.replaceAll('.', '_');

export const qualifiedName = (name: string): string => `mcp__${MCP_SERVER_NAME}__${mcpToolName(name)}`;

const inputShape = (registered: RegisteredTool): Record<string, z.ZodType> => {
  if (!(registered.input instanceof z.ZodObject)) {
    throw new DomainError(`Tool ${registered.name} musí mít objektový vstup, aby ho agent mohl volat`, {
      code: 'tool_input_not_object',
      details: { tool: registered.name },
    });
  }
  return registered.input.shape;
};

const bridge = (ctx: RequestContext, registered: RegisteredTool, autonomy: Autonomy) =>
  tool(
    mcpToolName(registered.name),
    registered.description,
    inputShape(registered),
    async (args: unknown) => {
      try {
        assertAutonomyAllows(autonomy, registered, await registered.approval(ctx, args));
        const execution = await executeTool(ctx, registered.name, args);
        return { content: [{ type: 'text' as const, text: JSON.stringify(execution) }] };
      } catch (error) {
        logger().warn({ tool: registered.name, error }, 'Tool agenta selhal');
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(toToolErrorResult(error)) }],
          isError: true,
        };
      }
    },
    { annotations: { readOnlyHint: registered.readOnly } },
  );

/**
 * The tool set the model actually sees: the definition's tools, intersected with what the agent
 * identity may do, narrowed by autonomy. The prompt is never asked to respect any of it.
 */
export const createAgentServer = (
  ctx: RequestContext,
  definition: AgentDefinition,
  autonomy: Autonomy,
): McpSdkServerConfigWithInstance => {
  const permitted = getTools({ names: definition.tools, actor: ctx.actor });
  return createSdkMcpServer({
    name: MCP_SERVER_NAME,
    version: definition.version,
    tools: toolsForAutonomy(permitted, autonomy).map((registered) => bridge(ctx, registered, autonomy)),
  });
};
