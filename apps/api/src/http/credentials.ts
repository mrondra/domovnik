import type { FastifyRequest } from 'fastify';
import { SESSION_COOKIE } from '../../../../packages/kernel/src/identity/index';
import type { CredentialKind } from './state';

export interface Credential {
  readonly kind: CredentialKind;
  readonly token: string;
}

const BEARER = /^Bearer (?<token>\S+)$/;
/** The approval link is the URL itself, so the credential has to be read before routing. */
const SIGNED_LINK = /^\/a\/(?<token>[^/?]+)/;

/**
 * One cookie by name. Written by hand because the only cookie this API sets is its own session and
 * its value is base64url — a cookie parser would be a dependency to read one known key.
 */
const cookie = (header: string | undefined, name: string): string | undefined =>
  header
    ?.split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1);

export const readCredential = (request: FastifyRequest): Credential | undefined => {
  const linked = SIGNED_LINK.exec(request.url)?.groups?.['token'];
  if (linked !== undefined) return { kind: 'signed-link', token: decodeURIComponent(linked) };

  const bearer = BEARER.exec(request.headers.authorization ?? '')?.groups?.['token'];
  if (bearer !== undefined) return { kind: 'api-token', token: bearer };

  const session = cookie(request.headers.cookie, SESSION_COOKIE);
  return session === undefined ? undefined : { kind: 'session', token: session };
};
