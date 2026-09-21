import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { queueNameFor } from '../../../kernel/src/events/index';
import { getInvoice, invoiceApproved } from '../../invoices/index';
import { pohodaMock } from '../adapters/index';
import { listJobs } from '../service/index';
import { postApprovedInvoice } from '../subscribers/post-invoice';
import { startComposedDb, withTestTenant, type TestDatabase } from './accounting.fixture';
import { approvedInvoice, deliver, linkedHouse, type LinkedHouse } from './flow.fixture';

let database: TestDatabase;
let ctx: RequestContext;
let house: LinkedHouse;

beforeAll(async () => {
  database = await startComposedDb();
  ctx = (await withTestTenant()).ctx;
  house = await linkedHouse(ctx);
}, 300_000);

afterAll(async () => {
  await database.stop();
});

const approve = (invoiceId: string, svjId: string): Promise<void> =>
  deliver(ctx, postApprovedInvoice.handler, {
    name: invoiceApproved.name,
    version: invoiceApproved.version,
    payload: {
      invoiceId,
      svjId,
      supplierId: svjId,
      amountTotal: 12_100,
      dueOn: '2026-09-30',
      variableSymbol: null,
      budgetCategory: null,
    },
  });

describe('the subscriber on finance.invoice.approved', () => {
  it('is registered under a queue named after the event and the subscriber', () => {
    expect(postApprovedInvoice.queue).toBe(
      queueNameFor('finance.invoice.approved', 'accounting-sync.post-invoice'),
    );
  });

  it('writes the invoice into the accounting and marks it posted', async () => {
    const invoice = await approvedInvoice(ctx, house, '5001');

    await approve(invoice.id, house.svjId);

    const posted = await getInvoice(ctx, invoice.id);
    expect(posted.status).toBe('posted');
    expect(posted.accountingRef).not.toBeNull();
    await expect(
      pohodaMock.fetchInvoice(ctx, house.svjId, posted.accountingRef ?? ''),
    ).resolves.toMatchObject({ externalNumber: 'F-5001', amountTotal: 12_100, paid: false });
  });

  it('leaves a second delivery of the same event alone', async () => {
    const invoice = await approvedInvoice(ctx, house, '5002');

    await approve(invoice.id, house.svjId);
    const after = await getInvoice(ctx, invoice.id);
    await approve(invoice.id, house.svjId);

    await expect(getInvoice(ctx, invoice.id)).resolves.toMatchObject({
      status: 'posted',
      accountingRef: after.accountingRef,
    });
    const jobs = await listJobs(ctx, house.svjId);
    expect(jobs.filter((job) => job.kind === 'post_invoice' && job.status === 'done').length).toBe(
      jobs.filter((job) => job.kind === 'post_invoice').length,
    );
  });

  it('writes down every exchange, so a person can see what was said to Pohoda', async () => {
    const jobs = await listJobs(ctx, house.svjId);

    expect(jobs.every((job) => job.kind === 'post_invoice' && job.status === 'done')).toBe(true);
    expect(jobs.length).toBeGreaterThanOrEqual(2);
  });
});
