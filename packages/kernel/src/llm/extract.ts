import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import type { RequestContext } from '../context/index';
import { AdapterError } from '../errors/index';
import { anthropic } from './client';
import { request, throughFixtures, toUsage, usageSchema, type CompletionInput } from './request';
import { startTrace, type TokenUsage } from './tracing';

export interface ExtractionResult<T> {
  readonly value: T;
  readonly usage: TokenUsage;
}

const extractionSchema = z.object({ value: z.unknown(), usage: usageSchema });

export const extract = async <S extends z.ZodType>(
  ctx: RequestContext,
  schema: S,
  input: CompletionInput,
): Promise<ExtractionResult<z.output<S>>> => {
  const base = request({ model: 'haiku', ...input });
  const payload = { ...base, output_config: { format: zodOutputFormat(schema) } };
  const trace = startTrace(ctx, { name: 'llm.extract' });
  const generation = trace.generation({ name: 'extract', model: payload.model, input: payload });

  const recorded = await throughFixtures(
    { ...base, schema: z.toJSONSchema(schema) },
    extractionSchema,
    async () => {
      const response = await anthropic().messages.parse(payload);
      if (response.parsed_output === null) {
        throw new AdapterError('Model nevrátil strukturovaný výstup', {
          code: 'llm_extract_failed',
          retryable: true,
        });
      }
      return { value: response.parsed_output, usage: toUsage(response.usage) };
    },
  );

  const result = { value: schema.parse(recorded.value), usage: recorded.usage };
  generation.end({ output: result.value, usage: result.usage });
  return result;
};
