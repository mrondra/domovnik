import { z } from 'zod';
import type { RequestContext } from '../context/index';
import { extract } from './extract';
import type { CompletionInput } from './request';
import type { TokenUsage } from './tracing';

export interface ClassificationResult<L extends string> {
  readonly label: L;
  readonly usage: TokenUsage;
}

export const classify = async <const L extends readonly [string, ...string[]]>(
  ctx: RequestContext,
  labels: L,
  input: CompletionInput,
): Promise<ClassificationResult<L[number]>> => {
  const { value, usage } = await extract(ctx, z.object({ label: z.enum(labels) }), {
    ...input,
    system: `${input.system ?? ''}\nZařaď vstup do právě jedné kategorie: ${labels.join(', ')}.`.trim(),
  });
  return { label: value.label, usage };
};
