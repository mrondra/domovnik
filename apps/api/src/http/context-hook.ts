import type { FastifyInstance, FastifyRequest } from 'fastify';
import { v7 as uuidv7 } from 'uuid';
import { runInContext } from '../../../../packages/kernel/src/context/index';
import { UnauthenticatedError } from '../../../../packages/kernel/src/errors/index';
import { readCredential } from './credentials';
import { resolvePrincipal } from './principal';
import { rememberState } from './state';

const CORRELATION_HEADER = 'x-correlation-id';

const asError = (failure: unknown): Error =>
  failure instanceof Error
    ? failure
    : new UnauthenticatedError('Ověření přihlašovacího údaje selhalo', { cause: failure });

const correlationOf = (request: FastifyRequest): string => {
  const header = request.headers[CORRELATION_HEADER];
  const value = Array.isArray(header) ? header[0] : header;
  return value === undefined || value === '' ? uuidv7() : value;
};

/**
 * Fastify continues the request from inside `done()`, which is what lets the one `AsyncLocalStorage`
 * scope opened here — `runInContext`, from the kernel — cover the whole request, so every log line a
 * controller or a service writes carries the tenant and the correlation id (docs/engineering.md §9).
 *
 * A rejected credential is remembered rather than thrown: throwing from a hook bypasses Nest's
 * exception filter and the answer would not carry the `{ error: … }` shape. `AuthenticationGuard`
 * raises it one step later, where the filter can see it.
 */
export const registerRequestContext = (instance: FastifyInstance): void => {
  instance.addHook('onRequest', (request, _reply, done) => {
    const correlationId = correlationOf(request);
    const credential = readCredential(request);

    if (credential === undefined) {
      rememberState(request.raw, { correlationId });
      done();
      return;
    }

    resolvePrincipal(request, credential, correlationId).then(
      (principal) => {
        rememberState(request.raw, { correlationId, principal });
        runInContext(principal.ctx, done);
      },
      (failure: unknown) => {
        rememberState(request.raw, { correlationId, failure: asError(failure) });
        done();
      },
    );
  });
};
