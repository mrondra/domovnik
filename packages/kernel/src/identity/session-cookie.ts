/**
 * The name of the session cookie. It is part of the authentication contract, not of one
 * application: `apps/api` issues the cookie, `apps/web` reads it in its middleware to tell a signed
 * in visitor from an anonymous one. Two spellings of the same string would be two places to get it
 * wrong, so it lives with the rest of identity.
 */
export const SESSION_COOKIE = 'domovnik_session';
