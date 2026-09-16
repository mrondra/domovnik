import { symbolOf, subscriberId, type SubscriberInput } from './subscriber-names';

export const subscriberTs = (
  input: SubscriberInput,
): string => `import { subscribe } from '../../../kernel/src/events/index';
import { logger } from '../../../kernel/src/logger/index';

/**
 * Subscribing registers the handler; \`loadSubscribersFrom\` finds the file by glob, so nothing
 * imports it by hand (AGENTS.md §6). The subscriber id is half of the queue name — renaming it
 * means a new queue, and the jobs left in the old one have nobody to take them.
 *
 * Delivery is at-least-once, so replace the body with a call to the feature's service and make that
 * call idempotent: the second delivery of an event must not repeat the effect of the first.
 */
export const ${symbolOf(input)} = subscribe(
  '${input.event}',
  (ctx, event) => {
    logger().info({ tenantId: ctx.tenantId, eventId: event.eventId }, '${subscriberId(input)}');
    return Promise.resolve();
  },
  { subscriber: '${subscriberId(input)}' },
);
`;
