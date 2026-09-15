import { createContext, type RequestContext } from '../context/index';
import { DomainError } from '../errors/index';
import type { EventId, TenantId } from '../ids/index';

export interface DeliveredEvent<P = unknown> {
  readonly eventId: EventId;
  readonly name: string;
  readonly version: number;
  readonly payload: P;
  readonly tenantId: TenantId;
  readonly correlationId: string;
}

export type EventHandler = (ctx: RequestContext, event: DeliveredEvent) => Promise<void>;

export interface SubscriptionOptions {
  /** Stable identifier of the consumer; it becomes the queue name, so it must not change lightly. */
  readonly subscriber: string;
  readonly idempotencyKey?: (event: DeliveredEvent) => string;
  /** How many deliveries this consumer tolerates at once. Defaults to one — order over throughput. */
  readonly concurrency?: number | undefined;
}

export interface Subscription {
  readonly event: string;
  readonly subscriber: string;
  readonly queue: string;
  readonly handler: EventHandler;
  readonly idempotencyKey: (event: DeliveredEvent) => string;
  readonly concurrency: number;
}

const subscriptions = new Map<string, Subscription>();

const DEFAULT_CONCURRENCY = 1;

/** pg-boss accepts letters, digits, `_`, `-`, `.` and `/` in a queue name, and nothing else. */
const QUEUE_NAME = /^[A-Za-z0-9_\-./]+$/;

export const queueNameFor = (event: string, subscriber: string): string => {
  const queue = `${event}/${subscriber}`;
  if (!QUEUE_NAME.test(queue)) {
    throw new DomainError(`Z odběru ${queue} nejde udělat název fronty`, {
      code: 'subscription_name_invalid',
      details: { event, subscriber },
    });
  }
  return queue;
};

export const subscribe = (
  name: string,
  handler: EventHandler,
  options: SubscriptionOptions,
): Subscription => {
  const queue = queueNameFor(name, options.subscriber);
  const subscription: Subscription = {
    event: name,
    subscriber: options.subscriber,
    queue,
    handler,
    idempotencyKey: options.idempotencyKey ?? ((delivered) => delivered.eventId),
    concurrency: options.concurrency ?? DEFAULT_CONCURRENCY,
  };
  subscriptions.set(queue, subscription);
  return subscription;
};

export const registeredSubscriptions = (): readonly Subscription[] => [...subscriptions.values()];

export const subscriptionsFor = (event: string): readonly Subscription[] =>
  registeredSubscriptions().filter((subscription) => subscription.event === event);

export const clearSubscriptions = (): void => {
  subscriptions.clear();
};

/** Delivery runs as `system`: the original actor is preserved on the event row, not re-impersonated. */
export const deliveryContext = (delivered: DeliveredEvent): RequestContext =>
  createContext({
    tenantId: delivered.tenantId,
    actor: { type: 'system', id: null, roles: [] },
    correlationId: delivered.correlationId,
  });
