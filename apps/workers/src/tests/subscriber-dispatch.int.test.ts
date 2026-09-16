import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { withTenant } from '../../../../packages/kernel/src/db/index';
import {
  clearSubscriptions,
  createJobQueue,
  createOutboxRelay,
  createPgBossPublisher,
  events,
  loadSubscribersFrom,
  registeredSubscriptions,
  startEventWorkers,
} from '../../../../packages/kernel/src/events/index';
import type { EventId } from '../../../../packages/kernel/src/ids/index';
import {
  startTestDb,
  withTestTenant,
  type TestDatabase,
  type TestTenant,
} from '../../../../packages/kernel/src/testing/index';
import { rewindOutbox, settle, waitFor } from './queue.fixture';

/** The same glob shape `registry.ts` uses, pointed at a fixture that stands in for a feature. */
const SUBSCRIBER_FILES = join(import.meta.dirname, 'subscriber*.fixture.ts');

let database: TestDatabase;
let tenant: TestTenant;
let queue: Awaited<ReturnType<typeof createJobQueue>>;
let relay: ReturnType<typeof createOutboxRelay>;
let loaded: number;
let subscriber: typeof import('./subscriber.fixture');

beforeAll(async () => {
  database = await startTestDb();
  tenant = await withTestTenant();

  clearSubscriptions();
  loaded = await loadSubscribersFrom([SUBSCRIBER_FILES]);
  subscriber = await import('./subscriber.fixture');

  queue = await createJobQueue();
  await startEventWorkers(queue);
  relay = createOutboxRelay({ publisher: createPgBossPublisher(queue) });
}, 180_000);

afterAll(async () => {
  await queue.stop({ graceful: false });
  clearSubscriptions();
  await database.stop();
});

const emitSigned = (): Promise<EventId> =>
  withTenant(tenant.ctx, () =>
    events.emit(tenant.ctx, subscriber.contractSigned.create({ contractId: crypto.randomUUID() })),
  );

describe('a subscriber found by glob', () => {
  it('is registered by being imported, with a queue named after event and subscriber', () => {
    expect(loaded).toBe(1);
    expect(registeredSubscriptions().map((subscription) => subscription.queue)).toEqual([
      'demo.contract.signed/demo.contract-archive',
    ]);
  });

  it('runs once per event as system in the tenant of the event, even on a redelivery', async () => {
    const eventId = await emitSigned();

    expect(await relay.publishPending()).toBe(1);
    await waitFor(() => subscriber.deliveries.some((delivery) => delivery.eventId === eventId));

    await rewindOutbox(tenant.ctx, eventId);
    expect(await relay.publishPending()).toBe(1);
    await settle();

    const delivered = subscriber.deliveries.filter((delivery) => delivery.eventId === eventId);
    expect(delivered).toHaveLength(1);
    expect(delivered[0]).toMatchObject({ actorType: 'system', tenantId: tenant.ctx.tenantId });
  }, 120_000);
});
