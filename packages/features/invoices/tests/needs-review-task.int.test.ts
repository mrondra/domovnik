import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { queueNameFor } from '../../../kernel/src/events/index';
import { listTasks } from '../../tasks/index';
import { invoiceNeedsReview } from '../domain/events';
import { needsReviewTask } from '../subscribers/needs-review-task';
import { processScenario } from './extraction.fixture';
import { deliverEvent, startTaskWorld, type TaskWorld } from './task-world.fixture';

let env: TaskWorld;

beforeAll(async () => {
  env = await startTaskWorld();
}, 300_000);

afterAll(async () => {
  await env.world.stop();
});

const deliverNeedsReview = (invoiceId: string, reasons: readonly string[]): Promise<void> =>
  deliverEvent(env.ctx, needsReviewTask, invoiceNeedsReview, { invoiceId, svjId: env.svjId, reasons });

describe('the subscriber on finance.invoice.needs_review', () => {
  it('is registered under a queue named after the event and the subscriber', () => {
    expect(needsReviewTask.queue).toBe(
      queueNameFor('finance.invoice.needs_review', 'invoices.needs-review-task'),
    );
  });

  it('raises a high priority finance task for an invoice a check blocked', async () => {
    const invoice = await processScenario(env.ctx, env.svjId, 'unknown-supplier');
    await deliverNeedsReview(invoice.id, ['supplier_unknown']);

    const [task, ...rest] = await listTasks(env.ctx, { originType: 'invoice' });
    expect(rest).toHaveLength(0);
    expect(task).toMatchObject({
      priority: 'high',
      origin: { type: 'invoice', id: invoice.id },
      dedupeKey: `invoice:${invoice.id}:needs_review`,
      svjId: env.svjId,
    });
    expect(task?.title).toContain('neznámý');
    expect(task?.dueOn).not.toBeNull();
  });

  it('describes the reasons by their Czech labels', async () => {
    const [task] = await listTasks(env.ctx, { originType: 'invoice' });
    expect(task?.description).toContain('Neznámý dodavatel');
  });

  it('raises one task however many times the event is delivered', async () => {
    const invoice = await processScenario(env.ctx, env.svjId, 'repeated-number');
    await deliverNeedsReview(invoice.id, ['duplicate_number']);
    await deliverNeedsReview(invoice.id, ['duplicate_number']);

    const mine = (await listTasks(env.ctx, { originType: 'invoice' })).filter(
      (task) => task.origin?.id === invoice.id,
    );
    expect(mine).toHaveLength(1);
  });
});
