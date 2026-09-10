import type { ModelAlias } from '../tools/definition';

/** Sonnet decides, Haiku extracts and classifies (zadání §6.1, modelový tiering). */
export const MODEL_IDS: Readonly<Record<ModelAlias, string>> = {
  sonnet: 'claude-sonnet-5',
  haiku: 'claude-haiku-4-5',
};

export const resolveModel = (alias: ModelAlias): string => MODEL_IDS[alias];
