import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { queueNameFor } from '../../../kernel/src/events/index';
import { listTasks } from '../../tasks/index';
import { invoiceApproved, invoiceNeedsReview, invoiceRejected } from '../domain/events';
import { closeTaskOnApproval, closeTaskOnRejection } from '../subscribers/close-review-task';
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

const raiseTask = async (scenario: 'unknown-supplier' | 'repeated-number'): Promise<string> => {
  const invoice = await processScenario(env.ctx, env.svjId, scenario);
  await deliverEvent(env.ctx, needsReviewTask, invoiceNeedsReview, {
    invoiceId: invoice.id,
    svjId: env.svjId,
    reasons: ['supplier_unknown'],
  });
  return invoice.id;
};

const statusOf = async (invoiceId: string): Promise<readonly string[]> =>
  (await listTasks(env.ctx, { originType: 'invoice' }))
    .filter((task) => task.origin?.id === invoiceId)
    .map((task) => task.status);

const approved = (invoiceId: string) => ({
  invoiceId,
  svjId: env.svjId,
  supplierId: crypto.randomUUID(),
  amountTotal: 100,
  dueOn: '2026-11-01',
  variableSymbol: null,
  budgetCategory: null,
});

describe('closing the review task of a decided invoice', () => {
  it('has one queue per event, named after the event and its own subscriber', () => {
    expect(closeTaskOnApproval.queue).toBe(
      queueNameFor('finance.invoice.approved', 'invoices.close-review-task.approved'),
    );
    expect(closeTaskOnRejection.queue).toBe(
      queueNameFor('finance.invoice.rejected', 'invoices.close-review-task.rejected'),
    );
  });

  it('closes the task when the invoice is approved, however often that is delivered', async () => {
    const id = await raiseTask('unknown-supplier');
    expect(await statusOf(id)).toStrictEqual(['open']);

    await deliverEvent(env.ctx, closeTaskOnApproval, invoiceApproved, approved(id));
    await deliverEvent(env.ctx, closeTaskOnApproval, invoiceApproved, approved(id));

    expect(await statusOf(id)).toStrictEqual(['done']);
  });

  it('closes the task when the invoice is rejected, however often that is delivered', async () => {
    const id = await raiseTask('repeated-number');
    const payload = { invoiceId: id, svjId: env.svjId, reason: 'Nesmysl.' };

    await deliverEvent(env.ctx, closeTaskOnRejection, invoiceRejected, payload);
    await deliverEvent(env.ctx, closeTaskOnRejection, invoiceRejected, payload);

    expect(await statusOf(id)).toStrictEqual(['done']);
  });
});
