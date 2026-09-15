import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { withTenant } from '../../../../packages/kernel/src/db/index';
import {
  clearSubscriptions,
  createJobQueue,
  createOutboxRelay,
  createPgBossPublisher,
  defineEvent,
  events,
  startEventWorkers,
  type JobQueue,
} from '../../../../packages/kernel/src/events/index';
import type { EventId } from '../../../../packages/kernel/src/ids/index';
import {
  startTestDb,
  withTestTenant,
  type TestDatabase,
  type TestTenant,
} from '../../../../packages/kernel/src/testing/index';
import { rewindOutbox, settle, waitFor } from './queue.fixture';

const invoiceReceived = defineEvent('finance.invoice.received', z.object({ invoiceId: z.uuid() }));

let database: TestDatabase;
let tenant: TestTenant;
let queue: Awaited<ReturnType<typeof createJobQueue>>;
let relay: ReturnType<typeof createOutboxRelay>;
const handled: string[] = [];

beforeAll(async () => {
  database = await startTestDb();
  tenant = await withTestTenant();

  clearSubscriptions();
  events.subscribe(
    invoiceReceived.name,
    (_ctx, event) => {
      handled.push(event.eventId);
      return Promise.resolve();
    },
    { subscriber: 'invoice-processor' },
  );

  queue = await createJobQueue();
  await startEventWorkers(queue satisfies JobQueue);
  relay = createOutboxRelay({ publisher: createPgBossPublisher(queue) });
}, 180_000);

afterAll(async () => {
  await queue.stop({ graceful: false });
  clearSubscriptions();
  await database.stop();
});

const emitInvoice = (): Promise<EventId> =>
  withTenant(tenant.ctx, () =>
    events.emit(tenant.ctx, invoiceReceived.create({ invoiceId: crypto.randomUUID() })),
  );

describe('an event emitted in a transaction', () => {
  it('reaches its subscriber exactly once, even when the relay publishes it twice', async () => {
    const eventId = await emitInvoice();

    expect(await relay.publishPending()).toBe(1);
    await waitFor(() => handled.includes(eventId));
    expect(handled.filter((id) => id === eventId)).toHaveLength(1);

    await rewindOutbox(tenant.ctx, eventId);
    expect(await relay.publishPending()).toBe(1);
    await settle();

    expect(handled.filter((id) => id === eventId)).toHaveLength(1);
  }, 120_000);

  it('is not published again once the outbox row is marked', async () => {
    await emitInvoice();
    await relay.publishPending();

    expect(await relay.publishPending()).toBe(0);
  }, 60_000);
});
