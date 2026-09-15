import { beforeEach, describe, expect, it } from 'vitest';
import { applyTestEnv } from '../testing/env';
import { agentLimits, createPgBossPublisher, startEventWorkers, type JobQueue } from './queue';
import { clearSubscriptions, subscribe, type DeliveredEvent } from './subscribe';

interface WorkerRegistration {
  readonly queue: string;
  readonly concurrency: number;
  readonly handler: (jobs: { data: DeliveredEvent }[]) => Promise<unknown>;
}

const fakeBoss = () => {
  const sent: { queue: string; id: string }[] = [];
  const created: string[] = [];
  const workers: WorkerRegistration[] = [];

  const boss: JobQueue = {
    send: (queue, _data, options) => {
      sent.push({ queue, id: options.id });
      return Promise.resolve(options.id);
    },
    createQueue: (name) => {
      created.push(name);
      return Promise.resolve();
    },
    work: (queue, options, handler) => {
      workers.push({ queue, concurrency: options.localConcurrency, handler });
      return Promise.resolve(`worker-${queue}`);
    },
  };

  return { boss, sent, created, workers };
};

const delivered: DeliveredEvent = {
  eventId: crypto.randomUUID() as never,
  name: 'finance.invoice.received',
  version: 1,
  payload: { invoiceId: 'x' },
  tenantId: crypto.randomUUID() as never,
  correlationId: 'corr-1',
};

beforeEach(() => {
  applyTestEnv();
  clearSubscriptions();
});

describe('createPgBossPublisher', () => {
  it('sends with the deterministic job id so a repeat is a no-op', async () => {
    const { boss, sent } = fakeBoss();
    await createPgBossPublisher(boss).send('queue', delivered, { id: 'job-1' });
    expect(sent).toEqual([{ queue: 'queue', id: 'job-1' }]);
  });
});

describe('startEventWorkers', () => {
  it('creates a queue and a worker per subscription', async () => {
    const handled: string[] = [];
    subscribe(
      'finance.invoice.received',
      (ctx, event) => {
        handled.push(`${ctx.actor.type}:${event.name}`);
        return Promise.resolve();
      },
      { subscriber: 'invoice-processor' },
    );

    const { boss, created, workers } = fakeBoss();
    const ids = await startEventWorkers(boss);

    expect(created).toEqual(['finance.invoice.received/invoice-processor']);
    expect(ids).toEqual(['worker-finance.invoice.received/invoice-processor']);

    await workers[0]?.handler([{ data: delivered }]);
    expect(handled).toEqual(['system:finance.invoice.received']);
  });

  it('gives a subscription the concurrency it asked for', async () => {
    subscribe('finance.invoice.received', () => Promise.resolve(), {
      subscriber: 'agent.invoice-processor',
      concurrency: 4,
    });

    const { boss, workers } = fakeBoss();
    await startEventWorkers(boss);

    expect(workers[0]?.concurrency).toBe(4);
  });

  it('never grows a subscription beyond the node cap', async () => {
    subscribe('finance.invoice.received', () => Promise.resolve(), {
      subscriber: 'agent.invoice-processor',
      concurrency: 4,
    });

    const { boss, workers } = fakeBoss();
    await startEventWorkers(boss, { maxConcurrency: 2 });

    expect(workers[0]?.concurrency).toBe(2);
  });
});

describe('agentLimits', () => {
  it('reads the runtime limits from the environment', () => {
    applyTestEnv({ AGENT_MAX_CONCURRENCY: '8', AGENT_TENANT_MAX_CONCURRENCY: '3' });
    expect(agentLimits()).toEqual({ perAgent: 8, perTenant: 3, tokenBudget: 200_000 });
  });
});
