import { setTimeout as delay } from 'node:timers/promises';
import type { OutboxRelay } from '../../../../packages/kernel/src/events/index';
import { logger } from '../../../../packages/kernel/src/logger/index';

const POLL_INTERVAL_MS = 1000;

export interface RelayLoop {
  stop(): Promise<void>;
}

/** A failed batch must not kill the loop: the rows stay `pending` and the next pass picks them up. */
const publishSafely = async (relay: OutboxRelay): Promise<void> => {
  try {
    const published = await relay.publishPending();
    if (published > 0) logger().info({ published }, 'Outbox batch published');
  } catch (error) {
    logger().error({ error }, 'Outbox relay batch failed');
  }
};

/**
 * Polling rather than LISTEN/NOTIFY: notify would hold a dedicated connection to shave a second off
 * a path that is already asynchronous, and polling is the correctness floor either way. The interval
 * is the upper bound on how long an emitted event waits before it reaches a subscriber.
 */
export const startRelayLoop = (relay: OutboxRelay, intervalMs = POLL_INTERVAL_MS): RelayLoop => {
  const idle = new AbortController();

  const loop = (async () => {
    while (!idle.signal.aborted) {
      await publishSafely(relay);
      await delay(intervalMs, undefined, { signal: idle.signal }).catch(() => undefined);
    }
  })();

  return {
    stop: async () => {
      idle.abort();
      await loop;
    },
  };
};
