import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { event as eventTable, eventOutbox } from '../db/schema/index';
import { DomainError } from '../errors/index';
import { withTenant } from '../db/tenant';
import { startTestDb, withTestTenant, type TestDatabase, type TestTenant } from '../testing/index';
import { defineEvent } from './definition';
import { emit } from './emit';
import { createOutboxRelay } from './relay';
import { clearSubscriptions, subscribe, type DeliveredEvent } from './subscribe';

const invoiceReceived = defineEvent('finance.invoice.received', z.object({ invoiceId: z.uuid() }));

let database: TestDatabase;
let tenant: TestTenant;

beforeAll(async () => {
  database = await startTestDb();
  tenant = await withTestTenant();
}, 120_000);

afterAll(async () => {
  clearSubscriptions();
  await database.stop();
});

const anyInvoice = () => invoiceReceived.create({ invoiceId: crypto.randomUUID() });

describe('events.emit', () => {
  it('rejects an event emitted outside a transaction', async () => {
    await expect(emit(tenant.ctx, anyInvoice())).rejects.toThrow(/uvnitř withTenant/);
  });

  it('writes the event and its outbox row together', async () => {
    const eventId = await withTenant(tenant.ctx, async () => emit(tenant.ctx, anyInvoice()));

    const rows = await withTenant(tenant.ctx, (tx) =>
      tx.select().from(eventOutbox).where(eq(eventOutbox.eventId, eventId)),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe('pending');
  });

  it('leaves no event behind when the transaction rolls back', async () => {
    const before = await withTenant(tenant.ctx, (tx) => tx.select().from(eventTable));

    await expect(
      withTenant(tenant.ctx, async () => {
        await emit(tenant.ctx, anyInvoice());
        throw new DomainError('rollback');
      }),
    ).rejects.toThrow('rollback');

    const after = await withTenant(tenant.ctx, (tx) => tx.select().from(eventTable));
    expect(after).toHaveLength(before.length);
  });
});

describe('outbox relay', () => {
  it('publishes each pending event once per subscription and marks it published', async () => {
    clearSubscriptions();
    subscribe('finance.invoice.received', () => Promise.resolve(), { subscriber: 'test-consumer' });

    const sent: { queue: string; id: string; event: DeliveredEvent }[] = [];
    const relay = createOutboxRelay({
      publisher: {
        send: (queue, data, options) => {
          sent.push({ queue, id: options.id, event: data });
          return Promise.resolve(options.id);
        },
      },
    });

    await withTenant(tenant.ctx, async () => emit(tenant.ctx, anyInvoice()));
    const published = await relay.publishPending();

    expect(published).toBeGreaterThan(0);
    expect(sent.every((entry) => entry.queue === 'finance.invoice.received/test-consumer')).toBe(true);
    expect(new Set(sent.map((entry) => entry.id)).size).toBe(sent.length);
    expect(await relay.publishPending()).toBe(0);
  });
});
