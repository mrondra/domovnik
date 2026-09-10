import { ValidationError } from '../errors/taxonomy';
import { envSchema, type Env } from './schema';

/** The only place in the codebase that reads `process.env`. */
const readProcessEnv = (): Record<string, string | undefined> => process.env;

let cached: Env | undefined;

export const loadEnv = (): Env => {
  if (cached !== undefined) return cached;

  const result = envSchema.safeParse(readProcessEnv());
  if (!result.success) {
    const missing = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new ValidationError(`Neplatná konfigurace prostředí:\n  ${missing.join('\n  ')}`, {
      code: 'env_invalid',
      details: { issues: missing },
    });
  }

  cached = result.data;
  return cached;
};

export const resetEnvCache = (): void => {
  cached = undefined;
};

/**
 * Log level is needed before `loadEnv()` can run, because a configuration error must be loggable.
 */
export const logLevel = (): Env['LOG_LEVEL'] => {
  const parsed = envSchema.shape.LOG_LEVEL.safeParse(readProcessEnv()['LOG_LEVEL']);
  return parsed.success ? parsed.data : 'info';
};

/** Base environment for a spawned agent process (the Claude Code CLI needs PATH, HOME, …). */
export const inheritedEnv = (): Record<string, string> =>
  Object.fromEntries(
    Object.entries(readProcessEnv()).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );

export const adminDatabaseUrl = (env: Env): string => env.DATABASE_ADMIN_URL ?? env.DATABASE_URL;
