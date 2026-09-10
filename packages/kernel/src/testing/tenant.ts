import { createContext, type RequestContext } from '../context/index';
import { createTenant, createUser } from '../identity/service/index';
import type { TenantId, UserId } from '../ids/index';

export interface TestTenant {
  readonly tenantId: TenantId;
  readonly adminId: UserId;
  readonly ctx: RequestContext;
}

let sequence = 0;

/** Provisions an isolated tenant with one `tenant_admin`, which is what most tests need. */
export const withTestTenant = async (name = 'Testovací správce'): Promise<TestTenant> => {
  sequence += 1;
  const tenantId = await createTenant({ name: `${name} ${String(sequence)}` });
  const bootstrap = createContext({
    tenantId,
    actor: { type: 'system', id: null, roles: [] },
  });

  const adminId = await createUser(bootstrap, {
    email: `admin${String(sequence)}@example.test`,
    displayName: 'Správce',
    password: 'test-password',
    roles: ['tenant_admin'],
  });

  return {
    tenantId,
    adminId,
    ctx: createContext({ tenantId, actor: { type: 'user', id: adminId, roles: ['tenant_admin'] } }),
  };
};
