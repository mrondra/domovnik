import { z } from 'zod';
import type { RequestContext } from '../context/index';
import { anthropic } from './client';
import { request, throughFixtures, toUsage, usageSchema, type CompletionInput } from './request';
import { startTrace, type TokenUsage } from './tracing';

export interface CompletionResult {
  readonly text: string;
  readonly usage: TokenUsage;
}

const completionSchema = z.object({ text: z.string(), usage: usageSchema });

export const complete = async (ctx: RequestContext, input: CompletionInput): Promise<CompletionResult> => {
  const payload = request(input);
  const trace = startTrace(ctx, { name: 'llm.complete' });
  const generation = trace.generation({ name: 'complete', model: payload.model, input: payload });

  const result = await throughFixtures(payload, completionSchema, async () => {
    const response = await anthropic().messages.create(payload);
    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');
    return { text, usage: toUsage(response.usage) };
  });

  generation.end({ output: result.text, usage: result.usage });
  return result;
};
