import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import type { Subscription } from '../../../kernel/src/events/index';
import { eventIdSchema, newId, tenantIdSchema, type SvjId } from '../../../kernel/src/ids/index';
import { SvjService } from '../../svj/index';
import { seedCleaningSupplier, seedTidySvj, useRecordedLlm } from './extraction.fixture';
import { startInvoicesWorld, withTestTenant, type InvoicesWorld } from './world.fixture';

export interface TaskWorld {
  readonly world: InvoicesWorld;
  readonly ctx: RequestContext;
  readonly svjId: SvjId;
}

/**
 * A tenant with one house in order and the `finance` department a task needs: `createTask` looks the
 * department up by code and answers `NotFoundError` without it, which a subscriber would retry.
 */
export const startTaskWorld = async (): Promise<TaskWorld> => {
  const world = await startInvoicesWorld();
  useRecordedLlm();
  const { ctx } = await withTestTenant();
  const service = new SvjService();
  await service.createDepartment(ctx, { code: 'finance', name: 'Finance' });
  const house = await service.createSvj(ctx, {
    name: 'SVJ Úkolová',
    ico: '29000001',
    address: { street: 'Krátká 1', city: 'Praha 1', postalCode: '110 00' },
    bankAccounts: ['1234567890/2010'],
  });
  await seedTidySvj(ctx, house.id, await seedCleaningSupplier(ctx));
  return { world, ctx, svjId: house.id };
};

/** What the worker does: the handler runs inside the tenant, with an event it has not seen before. */
export const deliverEvent = (
  ctx: RequestContext,
  subscription: Subscription,
  event: { readonly name: string; readonly version: number },
  payload: unknown,
): Promise<void> =>
  withTenant(ctx, () =>
    subscription.handler(ctx, {
      eventId: newId(eventIdSchema),
      name: event.name,
      version: event.version,
      payload,
      tenantId: tenantIdSchema.parse(ctx.tenantId),
      correlationId: ctx.correlationId,
    }),
  );
