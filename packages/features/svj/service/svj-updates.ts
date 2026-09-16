import { eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { Svj, UpdateSvjInput } from '../domain/types';
import { svj } from '../schema';
import { getSvjById } from './svj-records';

/**
 * No event: the SVJ record is reference data, and nothing in the platform reacts to a changed
 * address the way it reacts to a changed unit share. The audit row carries before and after.
 */
export const updateSvj = (ctx: RequestContext, svjId: SvjId, input: UpdateSvjInput): Promise<Svj> =>
  withTenant(ctx, async (tx) => {
    const before = await getSvjById(ctx, svjId);
    const after: Svj = {
      ...before,
      name: input.name ?? before.name,
      address: input.address ?? before.address,
      committee: input.committee ?? before.committee,
      bankAccounts: input.bankAccounts ?? before.bankAccounts,
    };

    await tx
      .update(svj)
      .set({
        name: after.name,
        street: after.address.street,
        city: after.address.city,
        postalCode: after.address.postalCode,
        committee: [...after.committee],
        bankAccounts: [...after.bankAccounts],
        updatedAt: new Date(),
      })
      .where(eq(svj.id, svjId));

    await audit.record(ctx, {
      action: 'svj.svj.updated',
      entity: 'svj',
      entityId: svjId,
      reason: 'Změna údajů SVJ',
      before: { name: before.name, address: before.address, committee: before.committee },
      after: { name: after.name, address: after.address, committee: after.committee },
    });

    return after;
  });
