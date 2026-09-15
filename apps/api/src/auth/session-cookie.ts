import { SESSION_COOKIE } from '../../../../packages/kernel/src/identity/index';

const SECONDS_PER_DAY = 86_400;

/**
 * `HttpOnly` keeps the token out of JavaScript, `SameSite=Lax` lets the approval link from an e-mail
 * arrive authenticated while still refusing a cross-site POST (zadání kap. 2). `Secure` is left off
 * in development, where the demo runs on plain http.
 */
const attributes = (maxAge: number, isProduction: boolean): readonly string[] => [
  'Path=/',
  'HttpOnly',
  'SameSite=Lax',
  `Max-Age=${String(maxAge)}`,
  ...(isProduction ? ['Secure'] : []),
];

export const sessionCookie = (token: string, isProduction: boolean): string =>
  [`${SESSION_COOKIE}=${token}`, ...attributes(SECONDS_PER_DAY, isProduction)].join('; ');

export const clearedSessionCookie = (isProduction: boolean): string =>
  [`${SESSION_COOKIE}=`, ...attributes(0, isProduction)].join('; ');

export const SESSION_TTL_SECONDS = SECONDS_PER_DAY;
