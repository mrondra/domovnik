import type { MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/messages';
import { z } from 'zod';
import { loadEnv } from '../env/index';
import { fixtureKey, readFixture, writeFixture } from './fixtures';
import { resolveModel } from './models';
import type { TokenUsage } from './tracing';
import type { ModelAlias } from '../tools/definition';

const DEFAULT_MAX_TOKENS = 16_000;

export const usageSchema = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
});

export interface CompletionInput {
  readonly prompt: string;
  readonly system?: string | undefined;
  readonly model?: ModelAlias | undefined;
  readonly maxTokens?: number | undefined;
}

export const request = (input: CompletionInput): MessageCreateParamsNonStreaming => ({
  model: resolveModel(input.model ?? 'sonnet'),
  max_tokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
  ...(input.system === undefined ? {} : { system: input.system }),
  messages: [{ role: 'user' as const, content: input.prompt }],
});

export const toUsage = (usage: { input_tokens: number; output_tokens: number }): TokenUsage => ({
  inputTokens: usage.input_tokens,
  outputTokens: usage.output_tokens,
});

/**
 * `record` captures a live answer next to the test, `replay` serves it back. Replay is what makes
 * agent tests deterministic and offline.
 */
export const throughFixtures = async <S extends z.ZodType>(
  key: unknown,
  schema: S,
  run: () => Promise<z.output<S>>,
): Promise<z.output<S>> => {
  const mode = loadEnv().LLM_MODE;
  const digest = fixtureKey(key);

  if (mode === 'replay') return schema.parse(await readFixture(digest));

  const result = await run();
  if (mode === 'record') await writeFixture(digest, result);
  return result;
};
