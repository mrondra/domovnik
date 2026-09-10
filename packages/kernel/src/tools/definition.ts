import type { z } from 'zod';
import type { RequestContext } from '../context/index';

export type ModelAlias = 'sonnet' | 'haiku';

export interface ApprovalPolicy {
  readonly required: boolean;
  readonly approvers: readonly string[];
  readonly deadline?: Date | undefined;
}

export interface ToolDefinition<I extends z.ZodType = z.ZodType, O extends z.ZodType = z.ZodType> {
  readonly name: string;
  /** Written for the model: what it does, when to use it, what it returns. */
  readonly description: string;
  readonly input: I;
  readonly output: O;
  readonly permission: string;
  readonly approval: (ctx: RequestContext, input: z.output<I>) => ApprovalPolicy | Promise<ApprovalPolicy>;
  /** May a user-defined agent (ADR 0008) be composed from this tool? */
  readonly userComposable: boolean;
  /** No side effects — the only tools an agent with autonomy `read` ever sees. */
  readonly readOnly: boolean;
  /** Produces a draft or proposal rather than a committed change. */
  readonly proposal?: boolean;
  readonly model?: ModelAlias;
  readonly handler: (ctx: RequestContext, input: z.output<I>) => Promise<z.input<O>>;
}

export const neverRequiresApproval = (): ApprovalPolicy => ({ required: false, approvers: [] });
