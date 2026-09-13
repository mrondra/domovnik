import { UnauthenticatedError } from '../../../../packages/kernel/src/errors/index';
import { stateOf, type Principal } from './state';

/**
 * The one place that turns "no usable credential" into an error, so the reason a request is 401 is
 * the same whether the credential was missing, malformed, expired or revoked.
 */
export const requirePrincipal = (key: object): Principal => {
  const state = stateOf(key);
  if (state?.principal !== undefined) return state.principal;
  if (state?.failure !== undefined) throw state.failure;
  throw new UnauthenticatedError('Požadavek nemá identitu', { code: 'unauthenticated' });
};
