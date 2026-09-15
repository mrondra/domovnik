import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '../../../packages/kernel/src/identity/session-cookie';

/**
 * Reachable without a session: the login screen and the signed approval link, which carries its own
 * credential in the URL. Everything else is redirected to the login screen — the presence of the
 * cookie is only a cheap gate, the API is what decides whether the session is still valid.
 */
const PUBLIC_PATHS = ['/login', '/a/'];

export const middleware = (request: NextRequest): NextResponse => {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) return NextResponse.next();
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const login = new URL('/login', request.url);
  return NextResponse.redirect(login);
};

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
