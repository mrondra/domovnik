import Anthropic from '@anthropic-ai/sdk';
import { loadEnv } from '../env/index';

let client: Anthropic | undefined;

/** One of only two places allowed to import the Anthropic SDK (the other is `agents/runtime`). */
export const anthropic = (): Anthropic => {
  const env = loadEnv();
  client ??= new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    ...(env.ANTHROPIC_BASE_URL === undefined ? {} : { baseURL: env.ANTHROPIC_BASE_URL }),
  });
  return client;
};

export const resetAnthropicClient = (): void => {
  client = undefined;
};

export type { Anthropic };
