import { classify } from './classify';
import { complete } from './complete';
import { extract } from './extract';

export type { ClassificationResult } from './classify';
export type { CompletionResult } from './complete';
export type { ExtractionResult } from './extract';
export type { CompletionInput } from './request';
export { MODEL_IDS, resolveModel } from './models';
export { flushTraces, startTrace } from './tracing';
export type { Generation, TokenUsage, Trace } from './tracing';

export const llm = { complete, extract, classify } as const;
