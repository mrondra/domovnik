import { z } from 'zod';
import type { RequestContext } from '../../../../packages/kernel/src/context/index';
import { defineEvent, subscribe, type DeliveredEvent } from '../../../../packages/kernel/src/events/index';

/** Stands in for `packages/features/<f>/subscribers/<name>.ts`: a handler nobody imports by hand. */
export const contractSigned = defineEvent('demo.contract.signed', z.object({ contractId: z.uuid() }));

export interface Delivery {
  readonly eventId: string;
  readonly actorType: string;
  readonly tenantId: string;
}

export const deliveries: Delivery[] = [];

export const demoOnContractSigned = subscribe(
  contractSigned.name,
  (ctx: RequestContext, event: DeliveredEvent) => {
    deliveries.push({ eventId: event.eventId, actorType: ctx.actor.type, tenantId: ctx.tenantId });
    return Promise.resolve();
  },
  { subscriber: 'demo.contract-archive' },
);
