import type { Names } from '../lib/names';

export interface SubscriberInput {
  readonly feature: Names;
  /** The event as it is emitted: `finance.invoice.approved`, `tick.daily`. */
  readonly event: string;
  readonly subscriber: Names;
}

/** `demo` + `contract-archive` → the exported symbol `demoContractArchive`. */
export const symbolOf = (input: SubscriberInput): string =>
  `${input.feature.camel}${input.subscriber.pascal}`;

/** The id becomes half of the queue name, so it carries the feature that owns the handler. */
export const subscriberId = (input: SubscriberInput): string =>
  `${input.feature.kebab}.${input.subscriber.kebab}`;

export const queueName = (input: SubscriberInput): string => `${input.event}/${subscriberId(input)}`;

const EVENT_NAME = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/;

/** Two segments at least, lower snake inside them: `domena.entita.akce` (docs/engineering.md §3). */
export const isEventName = (value: string): boolean => EVENT_NAME.test(value);
