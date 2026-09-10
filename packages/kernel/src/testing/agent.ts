import type { RequestContext } from '../context/index';
import { runAgent, type AgentRunResult, type AgentTrigger } from '../agents/runtime';
import type { AgentDefinition } from '../agents/definition';
import { defineTool } from '../tools/registry/index';
import type { ToolDefinition } from '../tools/definition';
import { applyTestEnv } from './env';
import type { LlmReplay } from './replay/index';

export interface RunAgentInTestOptions {
  readonly llm: LlmReplay;
  readonly tools?: readonly ToolDefinition[] | undefined;
  readonly maxTurns?: number | undefined;
  readonly tokenBudget?: number | undefined;
}

/** Runs the real runtime against a fixture endpoint: tool dispatch is exercised, the model is not. */
export const runAgentInTest = async (
  ctx: RequestContext,
  definition: AgentDefinition,
  trigger: AgentTrigger,
  options: RunAgentInTestOptions,
): Promise<AgentRunResult> => {
  for (const mock of options.tools ?? []) {
    defineTool(mock);
  }

  const baseUrl = await options.llm.start();
  applyTestEnv({ ANTHROPIC_BASE_URL: baseUrl, ANTHROPIC_API_KEY: 'replay' });
  try {
    return await runAgent(ctx, definition, trigger, {
      maxTurns: options.maxTurns,
      tokenBudget: options.tokenBudget,
    });
  } finally {
    await options.llm.stop();
  }
};
