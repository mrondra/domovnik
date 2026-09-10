import { eq, inArray, sql } from 'drizzle-orm';
import { v5 as uuidv5 } from 'uuid';
import { withSystem } from '../db/tenant';
import { event as eventTable, eventOutbox } from '../db/schema/index';
import { eventIdSchema, tenantIdSchema } from '../ids/index';
import { logger } from '../logger/index';
import { subscriptionsFor, type DeliveredEvent } from './subscribe';

/** Namespace for deterministic job ids; changing it would replay the whole outbox. */
const JOB_NAMESPACE = '2b6e4b2a-3f2f-4f0f-9c1e-2a5a1c6a9d10';

export interface JobPublisher {
  send(queue: string, data: DeliveredEvent, options: { id: string }): Promise<string | null>;
}

const DEFAULT_BATCH_SIZE = 100;

export interface OutboxRelay {
  /** Sends one batch of pending events and returns how many it published. */
  publishPending(): Promise<number>;
}

export interface OutboxRelayOptions {
  readonly publisher: JobPublisher;
  readonly batchSize?: number;
}

const toDelivered = (row: {
  eventId: string;
  name: string;
  version: number;
  payload: unknown;
  tenantId: string;
  correlationId: string;
}): DeliveredEvent => ({
  eventId: eventIdSchema.parse(row.eventId),
  name: row.name,
  version: row.version,
  payload: row.payload,
  tenantId: tenantIdSchema.parse(row.tenantId),
  correlationId: row.correlationId,
});

/**
 * Moves events from the transactional outbox onto the job queue. Delivery is at-least-once; the
 * deterministic job id derived from the idempotency key makes a repeated send a no-op instead of a
 * second handler run.
 */
export const createOutboxRelay = (options: OutboxRelayOptions): OutboxRelay => {
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;

  const publishPending = async (): Promise<number> =>
    withSystem({ reason: 'event outbox relay' }, async (tx) => {
      const pending = await tx
        .select({
          outboxId: eventOutbox.id,
          eventId: eventOutbox.eventId,
          name: eventTable.name,
          version: eventTable.version,
          payload: eventTable.payload,
          tenantId: eventTable.tenantId,
          correlationId: eventTable.correlationId,
        })
        .from(eventOutbox)
        .innerJoin(eventTable, eq(eventTable.id, eventOutbox.eventId))
        .where(eq(eventOutbox.status, 'pending'))
        .orderBy(eventOutbox.createdAt)
        .limit(batchSize)
        .for('update', { skipLocked: true });

      const published: string[] = [];
      for (const row of pending) {
        const delivered = toDelivered(row);
        const sends = subscriptionsFor(delivered.name).map((subscription) =>
          options.publisher.send(subscription.queue, delivered, {
            id: uuidv5(`${subscription.queue}:${subscription.idempotencyKey(delivered)}`, JOB_NAMESPACE),
          }),
        );
        await Promise.all(sends);
        published.push(row.outboxId);
      }

      if (published.length > 0) {
        await tx
          .update(eventOutbox)
          .set({ status: 'published', publishedAt: sql`now()`, attempts: sql`attempts + 1` })
          .where(inArray(eventOutbox.id, published));
      }

      logger().debug({ published: published.length }, 'Outbox relay batch');
      return published.length;
    });

  return { publishPending };
};
