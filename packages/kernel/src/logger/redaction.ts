/**
 * Owner personal data, document contents and secrets must never reach the log sink; pino redacts
 * them before serialisation so a careless `logger.info({ user })` cannot leak them.
 */
const REDACTED_KEYS = ['password', 'token', 'authorization', 'email', 'phone'] as const;

export const REDACTION_CENSOR = '[redacted]';

export const redactionPaths: readonly string[] = REDACTED_KEYS.flatMap((key) => [
  key,
  `*.${key}`,
  `*.*.${key}`,
]);
