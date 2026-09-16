import { emit } from './emit';
import { subscribe } from './subscribe';

export { defineEvent } from './definition';
export type { EventDefinition, EventEnvelope } from './definition';
export { createOutboxRelay } from './relay';
export type { JobPublisher, OutboxRelay, OutboxRelayOptions } from './relay';
export { agentLimits, createJobQueue, createPgBossPublisher, startEventWorkers } from './queue';
export type { AgentLimits, EventWorkerLimits, JobQueue, QueueRetryPolicy } from './queue';
export { dailyTick, monthlyTick } from './ticks';
export { loadSubscribersFrom } from '../discovery';
export {
  clearSubscriptions,
  deliveryContext,
  queueNameFor,
  registeredSubscriptions,
  subscribe,
  subscriptionsFor,
} from './subscribe';
export type { DeliveredEvent, EventHandler, Subscription, SubscriptionOptions } from './subscribe';

export const events = { emit, subscribe } as const;
