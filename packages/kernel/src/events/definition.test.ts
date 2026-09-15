import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { clearSubscriptions, queueNameFor, subscribe, subscriptionsFor, deliveryContext } from './subscribe';
import { defineEvent } from './definition';

const invoiceReceived = defineEvent(
  'finance.invoice.received',
  z.object({ invoiceId: z.uuid(), total: z.number() }),
);

describe('defineEvent', () => {
  it('stamps the name and version onto every envelope', () => {
    const envelope = invoiceReceived.create({ invoiceId: crypto.randomUUID(), total: 10 });
    expect(envelope.name).toBe('finance.invoice.received');
    expect(envelope.version).toBe(1);
  });

  it('validates the payload at the point of emission', () => {
    expect(() => invoiceReceived.create({ invoiceId: 'nope', total: 10 })).toThrow();
  });

  it('carries an explicit version when the schema changes', () => {
    const v2 = defineEvent('finance.invoice.received', z.object({}), { version: 2 });
    expect(v2.create({}).version).toBe(2);
  });
});

describe('subscriptions', () => {
  it('derives a queue per event and subscriber', () => {
    clearSubscriptions();
    const subscription = subscribe('finance.invoice.received', () => Promise.resolve(), {
      subscriber: 'invoice-processor',
    });

    expect(subscription.queue).toBe('finance.invoice.received/invoice-processor');
    expect(subscriptionsFor('finance.invoice.received')).toHaveLength(1);
    expect(subscriptionsFor('other')).toHaveLength(0);
    clearSubscriptions();
  });

  it('refuses a subscriber name the queue could not be called', () => {
    // pg-boss would reject it at startup, far from whoever chose the name.
    expect(() => queueNameFor('finance.invoice.received', 'agent:invoice-processor')).toThrow(
      /nejde udělat název fronty/,
    );
  });

  it('defaults the idempotency key to the event id', () => {
    clearSubscriptions();
    const subscription = subscribe('x', () => Promise.resolve(), { subscriber: 's' });
    const delivered = {
      eventId: crypto.randomUUID() as never,
      name: 'x',
      version: 1,
      payload: {},
      tenantId: crypto.randomUUID() as never,
      correlationId: 'c',
    };
    expect(subscription.idempotencyKey(delivered)).toBe(delivered.eventId);
    clearSubscriptions();
  });

  it('delivers as the system actor, keeping the original correlation id', () => {
    const ctx = deliveryContext({
      eventId: crypto.randomUUID() as never,
      name: 'x',
      version: 1,
      payload: {},
      tenantId: crypto.randomUUID() as never,
      correlationId: 'corr-1',
    });
    expect(ctx.actor.type).toBe('system');
    expect(ctx.correlationId).toBe('corr-1');
  });
});
