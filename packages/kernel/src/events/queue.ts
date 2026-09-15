import { PgBoss } from 'pg-boss';
import { adminDatabaseUrl, loadEnv } from '../env/index';
import { logger } from '../logger/index';
import type { JobPublisher } from './relay';
import { deliveryContext, registeredSubscriptions, type DeliveredEvent } from './subscribe';

/** Retry with backoff, because most delivery failures are a rate limit or a busy external system. */
export interface QueueRetryPolicy {
  readonly retryLimit: number;
  readonly retryDelay: number;
  readonly retryBackoff: boolean;
}

/** The slice of pg-boss the kernel depends on; everything else stays with `apps/workers`. */
export interface JobQueue {
  send(name: string, data: DeliveredEvent, options: { id: string }): Promise<string | null>;
  createQueue(name: string, options?: QueueRetryPolicy): Promise<void>;
  work(
    name: string,
    options: { batchSize: number; localConcurrency: number },
    handler: (jobs: { data: DeliveredEvent }[]) => Promise<unknown>,
  ): Promise<string>;
}

const DELIVERY_RETRY: QueueRetryPolicy = { retryLimit: 5, retryDelay: 5, retryBackoff: true };

/** pg-boss owns its own schema, so it connects with the administrative credentials. */
export const createJobQueue = async (): Promise<PgBoss & JobQueue> => {
  const boss = new PgBoss({ connectionString: adminDatabaseUrl(loadEnv()) });
  await boss.start();
  return boss;
};

/**
 * pg-boss rejects a duplicate job id, so a relay that crashed between sending and marking the
 * outbox row published cannot deliver the same event to the same subscriber twice.
 */
export const createPgBossPublisher = (queue: JobQueue): JobPublisher => ({
  send: (name, data, options) => queue.send(name, data, { id: options.id }),
});

export interface EventWorkerLimits {
  /** Caps every subscription, whatever it asked for. Used to shrink a busy node, never to grow one. */
  readonly maxConcurrency?: number | undefined;
}

/**
 * Binds every registered subscription to its own queue. Called by `apps/workers` at startup.
 *
 * One job per fetch and `localConcurrency` pollers, rather than one poller fetching a batch: a batch
 * handler settles as a whole, so a single failing delivery would retry the rest with it.
 */
export const startEventWorkers = async (
  queue: JobQueue,
  limits: EventWorkerLimits = {},
): Promise<readonly string[]> => {
  const subscriptions = registeredSubscriptions();
  const cap = limits.maxConcurrency ?? Number.POSITIVE_INFINITY;

  await Promise.all(
    subscriptions.map((subscription) => queue.createQueue(subscription.queue, DELIVERY_RETRY)),
  );

  return Promise.all(
    subscriptions.map((subscription) => {
      const localConcurrency = Math.min(subscription.concurrency, cap);
      return queue.work(subscription.queue, { batchSize: 1, localConcurrency }, async (jobs) => {
        for (const job of jobs) {
          logger().debug({ queue: subscription.queue, eventId: job.data.eventId }, 'Delivering event');
          await subscription.handler(deliveryContext(job.data), job.data);
        }
      });
    }),
  );
};

export interface AgentLimits {
  readonly perAgent: number;
  readonly perTenant: number;
  readonly tokenBudget: number;
}

/** Runtime limits from zadání §6.1; `apps/workers` turns them into queue concurrency. */
export const agentLimits = (): AgentLimits => {
  const env = loadEnv();
  return {
    perAgent: env.AGENT_MAX_CONCURRENCY,
    perTenant: env.AGENT_TENANT_MAX_CONCURRENCY,
    tokenBudget: env.AGENT_TOKEN_BUDGET,
  };
};
