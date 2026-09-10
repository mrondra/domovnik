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
