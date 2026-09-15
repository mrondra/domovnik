import { cookies } from 'next/headers';
import { z } from 'zod';
import { SESSION_COOKIE } from '../../../../packages/kernel/src/identity/session-cookie';
import { apiUrl, failureOf, parseBody, type ApiFailure } from './client';

const loggedInSchema = z.object({ userId: z.uuid(), expiresAt: z.iso.datetime() });

export interface Credentials {
  readonly email: string;
  readonly password: string;
}

const sessionValue = (response: Response): string | null => {
  for (const header of response.headers.getSetCookie()) {
    const pair = header.split(';')[0] ?? '';
    if (pair.startsWith(`${SESSION_COOKIE}=`)) return pair.slice(SESSION_COOKIE.length + 1);
  }
  return null;
};

/**
 * Login is the one call that does not go through `callApi`: the session arrives as a `Set-Cookie`
 * header on the API's answer and has to be re-issued for this origin, which needs the response
 * itself. Attributes are set here rather than copied, so the cookie the browser keeps is the one
 * this application means: `HttpOnly`, `SameSite=Lax`, expiring with the session (zadání kap. 2).
 */
export const login = async (credentials: Credentials): Promise<ApiFailure | null> => {
  const response = await fetch(apiUrl('/auth/login'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(credentials),
    cache: 'no-store',
  });

  const payload = await parseBody(response);
  if (!response.ok) return failureOf(payload);

  const value = sessionValue(response);
  if (value === null) {
    return { ok: false, code: 'session_cookie_missing', message: 'API nevrátilo relaci.' };
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(loggedInSchema.parse(payload).expiresAt),
  });
  return null;
};

export const logout = async (): Promise<void> => {
  const jar = await cookies();
  const session = jar.get(SESSION_COOKIE);
  if (session !== undefined) {
    await fetch(apiUrl('/auth/logout'), {
      method: 'POST',
      headers: { cookie: `${SESSION_COOKIE}=${session.value}` },
      cache: 'no-store',
    });
  }
  jar.delete(SESSION_COOKIE);
};
