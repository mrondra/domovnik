import { z } from 'zod';
import { DomainError } from '../errors/index';
import type { RegisteredTool } from './registry/index';

/**
 * MCP tool names are `[A-Za-z0-9_-]`, so `invoice.extract` travels as `invoice_extract`. Both the
 * agent runtime and the MCP server expose the same registry over the same protocol, so they have to
 * agree on the name — a divergence here would be a tool an agent can call and a client cannot.
 */
export const mcpToolName = (name: string): string => name.replaceAll('.', '_');

/** MCP describes arguments as named properties, so a tool taking anything else cannot be exposed. */
export const toolInputShape = (tool: RegisteredTool): Record<string, z.ZodType> => {
  if (!(tool.input instanceof z.ZodObject)) {
    throw new DomainError(`Tool ${tool.name} musí mít objektový vstup, aby šel vystavit přes MCP`, {
      code: 'tool_input_not_object',
      details: { tool: tool.name },
    });
  }
  return tool.input.shape;
};
