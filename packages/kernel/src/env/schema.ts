import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),

  /** Application connection. Must NOT be a superuser or RLS is silently bypassed. */
  DATABASE_URL: z.url(),
  /** Owner connection used by migrations, seed and `withSystem`. Defaults to `DATABASE_URL`. */
  DATABASE_ADMIN_URL: z.url().optional(),

  /** HMAC key for session tokens, API token hashes and signed one-time links. */
  APP_SECRET: z.string().min(32),

  ANTHROPIC_API_KEY: z.string().min(1),
  ANTHROPIC_BASE_URL: z.url().optional(),

  LANGFUSE_BASE_URL: z.url().optional(),
  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),

  /** `replay` reads recorded fixtures instead of calling the model; `record` writes them. */
  LLM_MODE: z.enum(['live', 'record', 'replay']).default('live'),
  LLM_FIXTURE_DIR: z.string().default('fixtures/llm'),

  AGENT_MAX_CONCURRENCY: z.coerce.number().int().positive().default(4),
  AGENT_TENANT_MAX_CONCURRENCY: z.coerce.number().int().positive().default(2),
  AGENT_TOKEN_BUDGET: z.coerce.number().int().positive().default(200_000),

  S3_ENDPOINT: z.url(),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;
