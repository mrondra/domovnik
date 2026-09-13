import { createContext, type RequestContext } from '../../../../packages/kernel/src/context/index';
import type { TenantId } from '../../../../packages/kernel/src/ids/index';

/**
 * A signed link names its tenant and its addressee but not their roles, and roles have to be read
 * before the actor exists. This is the one context the API builds without a resolved actor.
 */
export const systemContextOf = (tenantId: TenantId): RequestContext =>
  createContext({ tenantId, actor: { type: 'system', id: null, roles: [] } });
