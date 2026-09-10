import type { z } from 'zod';
import type { Actor, RequestContext } from '../../context/index';
import { NotFoundError } from '../../errors/index';
import { hasPermission } from '../../identity/permissions';
import type { ToolDefinition } from '../definition';
import { erase, type RegisteredTool } from './registered-tool';

const registry = new Map<string, RegisteredTool>();

/** Registration is a side effect of definition, so a tool file never needs a manual import list. */
export const defineTool = <I extends z.ZodType, O extends z.ZodType>(
  definition: ToolDefinition<I, O>,
): ToolDefinition<I, O> => {
  registry.set(definition.name, erase(definition));
  return definition;
};

export const clearTools = (): void => {
  registry.clear();
};

export const requireTool = (name: string): RegisteredTool => {
  const tool = registry.get(name);
  if (tool === undefined) {
    throw new NotFoundError(`Tool ${name} není v registru`, {
      code: 'tool_not_found',
      details: { name },
    });
  }
  return tool;
};

export interface ToolQuery {
  readonly names?: readonly string[] | undefined;
  readonly actor: Actor;
}

export const getTools = (query: ToolQuery): readonly RegisteredTool[] =>
  [...registry.values()]
    .filter((tool) => query.names === undefined || query.names.includes(tool.name))
    .filter((tool) => hasPermission(query.actor, tool.permission));

export const runToolHandler = (ctx: RequestContext, tool: RegisteredTool, input: unknown): Promise<unknown> =>
  tool.handler(ctx, input);
