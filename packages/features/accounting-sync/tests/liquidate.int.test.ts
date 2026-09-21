import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { getInvoice, invoiceApproved, type InvoiceId } from '../../invoices/index';
import { paymentMatched } from '../../payments/index';
import { pohodaMock } from '../adapters/index';
import { listJobs } from '../service/index';
import { liquidateMatched } from '../subscribers/liquidate';
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

const postedInvoice = async (symbol: string): Promise<InvoiceId> => {
  const invoice = await approvedInvoice(ctx, house, symbol);
  await deliver(ctx, postApprovedInvoice.handler, {
    name: invoiceApproved.name,
    version: invoiceApproved.version,
    payload: {
      invoiceId: invoice.id,
      svjId: house.svjId,
      supplierId: house.svjId,
      amountTotal: invoice.amountTotal,
      dueOn: invoice.dueOn,
      variableSymbol: invoice.variableSymbol,
      budgetCategory: null,
    },
  });
  return invoice.id;
};

const pay = (targetId: string, targetType: 'invoice' | 'prescription'): Promise<void> =>
  deliver(ctx, liquidateMatched.handler, {
    name: paymentMatched.name,
    version: paymentMatched.version,
    payload: {
      svjId: house.svjId,
      transactionId: '00000000-0000-4000-8000-000000000001',
      targetType,
      targetId,
      method: 'vs_amount',
      amount: 12_100,
      bookedOn: '2026-09-20',
    },
  });

describe('the subscriber on finance.payment.matched', () => {
  it('tells the accounting the invoice was paid', async () => {
    const invoiceId = await postedInvoice('6001');
    const ref = (await getInvoice(ctx, invoiceId)).accountingRef ?? '';

    await pay(invoiceId, 'invoice');

    await expect(pohodaMock.fetchInvoice(ctx, house.svjId, ref)).resolves.toMatchObject({ paid: true });
  });

  it('says nothing about a payment for a prescription — not the accounting’s business', async () => {
    const before = (await listJobs(ctx, house.svjId)).length;

    await pay('00000000-0000-4000-8000-000000000002', 'prescription');

    await expect(listJobs(ctx, house.svjId)).resolves.toHaveLength(before);
  });

  it('settles nothing twice', async () => {
    const invoiceId = await postedInvoice('6002');

    await pay(invoiceId, 'invoice');
    await pay(invoiceId, 'invoice');

    const jobs = await listJobs(ctx, house.svjId);
    const liquidations = jobs.filter((job) => job.kind === 'liquidate');
    expect(liquidations.filter((job) => job.payload['entityId'] === invoiceId)).toHaveLength(1);
  });
});
