import { eq } from 'drizzle-orm';
import { tenant } from '../../db/schema/index';
import { withSystem } from '../../db/tenant';
import { newId, tenantIdSchema, type TenantId } from '../../ids/index';

export interface CreateTenantInput {
  readonly name: string;
  readonly ico?: string | undefined;
}

/** The first row of a tenant cannot be written under its own RLS policy, hence `withSystem`. */
export const createTenant = async (input: CreateTenantInput): Promise<TenantId> => {
  const tenantId = newId(tenantIdSchema);
  await withSystem({ reason: 'tenant provisioning' }, async (tx) => {
    await tx.insert(tenant).values({
      id: tenantId,
      tenantId,
      name: input.name,
      ico: input.ico ?? null,
    });
  });
  return tenantId;
};

/**
 * Cross-tenant by definition: the scheduler has no tenant of its own and has to fan a tick out to
 * every active one (zadání §5). Nothing else in the system is allowed to ask this question.
 */
export const listActiveTenants = async (): Promise<readonly TenantId[]> =>
  withSystem({ reason: 'scheduler tenant fan-out' }, async (tx) => {
    const rows = await tx.select({ id: tenant.id }).from(tenant).where(eq(tenant.isActive, true));
    return rows.map((row) => tenantIdSchema.parse(row.id));
  });
