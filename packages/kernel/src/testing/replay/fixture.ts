import { z } from 'zod';

const contentBlockSchema = z.object({
  type: z.enum(['text', 'tool_use']),
  text: z.string().optional(),
  id: z.string().optional(),
  name: z.string().optional(),
  input: z.record(z.string(), z.unknown()).optional(),
});

const fixtureMessageSchema = z.object({
  id: z.string(),
  model: z.string(),
  content: z.array(contentBlockSchema),
  stopReason: z.enum(['end_turn', 'tool_use']),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
});

const exchangeSchema = z.object({
  name: z.string(),
  when: z.object({
    /** Every fragment must appear in the request body. */
    contains: z.array(z.string()).optional(),
    /** No fragment may appear in the request body. */
    missing: z.array(z.string()).optional(),
  }),
  /** Either an assembled message or a raw recorded event stream. */
  message: fixtureMessageSchema.optional(),
  sse: z.string().optional(),
});

export const fixtureSchema = z.object({ exchanges: z.array(exchangeSchema) });

export type ExchangeMatcher = z.infer<typeof exchangeSchema>['when'];
export type RecordedExchange = z.infer<typeof exchangeSchema>;
export type LlmFixture = z.infer<typeof fixtureSchema>;
