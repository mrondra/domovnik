import { createContext, type RequestContext } from '../../context/index';
import type { TenantId } from '../../ids/index';

/**
 * Sign-in and token lookup happen before a tenant is known, so the row that resolves the credential
 * is read cross-tenant; everything after it runs under the tenant that credential belongs to.
 */
export const systemContext = (tenantId: TenantId): RequestContext =>
  createContext({ tenantId, actor: { type: 'system', id: null, roles: [] } });
