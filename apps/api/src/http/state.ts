import type { RequestContext } from '../../../../packages/kernel/src/context/index';
import type { SvjId } from '../../../../packages/kernel/src/ids/index';

export type CredentialKind = 'session' | 'api-token' | 'signed-link';

export interface Principal {
  readonly ctx: RequestContext;
  readonly credential: CredentialKind;
  /** API token only: the tool subset the token was issued for; `null` means no token was used. */
  readonly allowedTools: readonly string[] | null;
  /** The SVJ the credential is confined to; `null` means the whole tenant. */
  readonly svjScope: readonly SvjId[] | null;
  /** Signed link only: the one entity the link may act on. */
  readonly subjectId: string | null;
  /** Session only: kept so `POST /auth/logout` can revoke the very session it arrived on. */
  readonly sessionToken: string | null;
}

export interface RequestState {
  readonly correlationId: string;
  readonly principal?: Principal;
  /** A credential was presented and rejected. The guard raises it; the hook must not. */
  readonly failure?: Error;
}

/**
 * Off the request object rather than on it: a Fastify request is shared with plugins we do not own,
 * and a `WeakMap` cannot collide with them or outlive the request.
 */
const states = new WeakMap<object, RequestState>();

export const rememberState = (key: object, state: RequestState): void => {
  states.set(key, state);
};

export const stateOf = (key: object): RequestState | undefined => states.get(key);
