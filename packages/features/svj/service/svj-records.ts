import { eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import { withSvj, type RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import { events } from '../../../kernel/src/events/index';
import { newId, svjIdSchema, type SvjId } from '../../../kernel/src/ids/index';
import { svjCreated } from '../domain/events';
import type { CreateSvjInput, Svj } from '../domain/types';
import { svj } from '../schema';
import { reachable } from './reach';
import { toSvj } from './rows';

const notFound = (svjId: SvjId): NotFoundError =>
  new NotFoundError('SVJ nenalezeno', { code: 'svj_not_found', details: { svjId } });

export const createSvj = (ctx: RequestContext, input: CreateSvjInput): Promise<Svj> => {
  const created: Svj = {
    id: newId(svjIdSchema),
    name: input.name,
    ico: input.ico,
    address: input.address,
    committee: input.committee ?? [],
    bankAccounts: input.bankAccounts ?? [],
  };

  return withTenant(ctx, async (tx) => {
    await tx.insert(svj).values({
      id: created.id,
      tenantId: ctx.tenantId,
      createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
      name: created.name,
      ico: created.ico,
      street: created.address.street,
      city: created.address.city,
      postalCode: created.address.postalCode,
      committee: [...created.committee],
      bankAccounts: [...created.bankAccounts],
    });

    await audit.record(ctx, {
      action: 'svj.svj.created',
      entity: 'svj',
      entityId: created.id,
      reason: 'Založeno SVJ',
      after: { name: created.name, ico: created.ico },
    });

    await events.emit(
      withSvj(ctx, created.id),
      svjCreated.create({ svjId: created.id, name: created.name, ico: created.ico }),
    );

    return created;
  });
};

/**
 * An SVJ the actor may not reach answers the same as one that does not exist: whether it exists is
 * itself something they may not learn (zadání kap. 9).
 */
export const getSvjById = (ctx: RequestContext, svjId: SvjId): Promise<Svj> =>
  withTenant(ctx, async (tx) => {
    if (!(await reachable(ctx, svjId))) throw notFound(svjId);

    const rows = await tx.select().from(svj).where(eq(svj.id, svjId)).limit(1);
    const row = rows[0];
    if (row === undefined) throw notFound(svjId);
    return toSvj(row);
  });
