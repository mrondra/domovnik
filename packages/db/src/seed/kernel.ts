import { eq } from 'drizzle-orm';
import { createContext } from '../../../kernel/src/context/index';
import { tenant } from '../../../kernel/src/db/schema/index';
import { withSystem } from '../../../kernel/src/db/index';
import { tenantIdSchema, type TenantId } from '../../../kernel/src/ids/index';
import { createTenant } from '../../../kernel/src/identity/index';
import { seedAgentIdentities } from './agent-identities';
import { seedDemoUsers } from './demo-users';
import type { SeedContext } from './types';

export const DEMO_TENANT_NAME = 'Demo správa s.r.o.';

/** The tenant row is written outside RLS (it is its own tenant), so it is also read that way. */
const findTenant = (name: string): Promise<TenantId | undefined> =>
  withSystem({ reason: 'seed tenant lookup' }, async (tx) => {
    const rows = await tx.select({ id: tenant.id }).from(tenant).where(eq(tenant.name, name)).limit(1);
    const found = rows[0];
    return found === undefined ? undefined : tenantIdSchema.parse(found.id);
  });

/**
 * The tables the kernel owns: the demo tenant, one user per role and an identity for every
 * registered agent. Keyed by name, e-mail and agent name + version, so it is safe to re-run.
 */
export const seedKernel = async (): Promise<SeedContext> => {
  const tenantId = (await findTenant(DEMO_TENANT_NAME)) ?? (await createTenant({ name: DEMO_TENANT_NAME }));
  const ctx = createContext({ tenantId, actor: { type: 'system', id: null, roles: [] } });

  await seedDemoUsers(ctx);
  await seedAgentIdentities(ctx);

  return { tenantId, ctx };
};
