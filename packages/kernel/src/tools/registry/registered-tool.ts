import type { z } from 'zod';
import type { RequestContext } from '../../context/index';
import { ValidationError } from '../../errors/index';
import type { ApprovalPolicy, ModelAlias, ToolDefinition } from '../definition';

/**
 * Type-erased registry entry. Validation moves inside the entry so callers can pass `unknown`
 * without the registry giving up type safety at the definition site.
 */
export interface RegisteredTool {
  readonly name: string;
  readonly description: string;
  readonly input: z.ZodType;
  readonly output: z.ZodType;
  readonly permission: string;
  readonly userComposable: boolean;
  readonly readOnly: boolean;
  readonly proposal: boolean;
  readonly model?: ModelAlias | undefined;
  readonly approval: (ctx: RequestContext, input: unknown) => Promise<ApprovalPolicy>;
  readonly handler: (ctx: RequestContext, input: unknown) => Promise<unknown>;
}

const parseOrThrow = <S extends z.ZodType>(
  schema: S,
  value: unknown,
  message: string,
  code: string,
): z.output<S> => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new ValidationError(message, { code, details: { issues: parsed.error.issues } });
  }
  return parsed.data;
};

export const erase = <I extends z.ZodType, O extends z.ZodType>(
  definition: ToolDefinition<I, O>,
): RegisteredTool => {
  const parseInput = (input: unknown): z.output<I> =>
    parseOrThrow(definition.input, input, `Neplatný vstup pro tool ${definition.name}`, 'tool_input_invalid');

  return {
    name: definition.name,
    description: definition.description,
    input: definition.input,
    output: definition.output,
    permission: definition.permission,
    userComposable: definition.userComposable,
    readOnly: definition.readOnly,
    proposal: definition.proposal ?? false,
    model: definition.model,
    approval: async (ctx, input) => definition.approval(ctx, parseInput(input)),
    handler: async (ctx, input) =>
      parseOrThrow(
        definition.output,
        await definition.handler(ctx, parseInput(input)),
        `Neplatný výstup toolu ${definition.name}`,
        'tool_output_invalid',
      ),
  };
};
