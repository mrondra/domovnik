import { Langfuse } from 'langfuse';
import type { RequestContext } from '../context/index';
import { loadEnv } from '../env/index';

export interface TokenUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export interface Generation {
  end(result: { readonly output: unknown; readonly usage: TokenUsage }): void;
}

export interface Trace {
  readonly id: string;
  generation(input: { readonly name: string; readonly model: string; readonly input: unknown }): Generation;
  end(output: unknown): void;
}

const NOOP_GENERATION: Generation = { end: () => undefined };

const noopTrace = (id: string): Trace => ({
  id,
  generation: () => NOOP_GENERATION,
  end: () => undefined,
});

let langfuse: Langfuse | undefined | null;

const configuration = (): { baseUrl: string; publicKey: string; secretKey: string } | null => {
  const {
    LANGFUSE_BASE_URL: baseUrl,
    LANGFUSE_PUBLIC_KEY: publicKey,
    LANGFUSE_SECRET_KEY: secretKey,
  } = loadEnv();
  if (baseUrl === undefined || publicKey === undefined || secretKey === undefined) return null;
  return { baseUrl, publicKey, secretKey };
};

/** Tracing is optional: without Langfuse credentials every trace becomes a no-op. */
const client = (): Langfuse | null => {
  if (langfuse !== undefined) return langfuse;
  const config = configuration();
  langfuse = config === null ? null : new Langfuse(config);
  return langfuse;
};

export interface StartTraceInput {
  readonly name: string;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}

export const startTrace = (ctx: RequestContext, input: StartTraceInput): Trace => {
  const langfuseClient = client();
  if (langfuseClient === null) return noopTrace(ctx.correlationId);

  const trace = langfuseClient.trace({
    name: input.name,
    sessionId: ctx.correlationId,
    metadata: { tenantId: ctx.tenantId, svjId: ctx.svjId, ...input.metadata },
  });

  return {
    id: trace.id,
    generation: (generationInput) => {
      const generation = trace.generation(generationInput);
      return {
        end: (result) =>
          generation.end({
            output: result.output,
            usageDetails: { input: result.usage.inputTokens, output: result.usage.outputTokens },
          }),
      };
    },
    end: (output) => trace.update({ output }),
  };
};

export const flushTraces = async (): Promise<void> => {
  await client()?.flushAsync();
};

export const resetTracing = (): void => {
  langfuse = undefined;
};
