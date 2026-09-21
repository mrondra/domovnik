import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { newRowId } from '../../../kernel/src/ids/index';
import { InvoicesService, getInvoice, type InvoiceId } from '../../invoices/index';
import type { IncomingTransaction } from '../domain/types';
import { importTransactions } from '../service/index';
import {
  seedPaidHouse,
  startPaymentsDb,
  withTestTenant,
  type PaidHouse,
  type TestDatabase,
} from './payments.fixture';

const AMOUNT = 12_100;

let database: TestDatabase;
let ctx: RequestContext;
let house: PaidHouse;
let sequence = 0;

const invoices = new InvoicesService();

/** An invoice taken as far as the caller asks; only a posted one may be called paid (ADR 0005). */
const payableInvoice = async (upTo: 'approved' | 'posted', symbol: string): Promise<InvoiceId> => {
  sequence += 1;
  const supplier = await invoices.createSupplier(ctx, {
    name: `Dodavatel ${String(sequence)}`,
    ico: String(70_000_000 + sequence),
  });
  // The scan itself is `documents`' business; matching money cares only that the invoice exists.
  const received = await invoices.createInvoice(ctx, {
    svjId: house.svjId,
    documentId: newRowId(),
    source: 'email',
    receivedAt: new Date('2026-09-01T08:00:00.000Z'),
  });

  await invoices.transition(ctx, received.id, 'extracted', {
    supplierId: supplier.id,
    externalNumber: `F-${symbol}`,
    variableSymbol: symbol,
    issuedOn: '2026-09-01',
    dueOn: '2026-09-30',
    amountTotal: AMOUNT,
  });
  await invoices.transition(ctx, received.id, 'pending_approval');
  await invoices.transition(ctx, received.id, 'approved');
  if (upTo === 'posted') {
    await invoices.transition(ctx, received.id, 'posted', { accountingRef: `POHODA-${symbol}` });
  }

  return received.id;
};

const paymentOut = (symbol: string): IncomingTransaction => ({
  externalId: `out-${symbol}`,
  bookedOn: '2026-09-20',
  amount: -AMOUNT,
  counterpartyName: 'Dodavatel',
  variableSymbol: symbol,
});

const importOne = (movement: IncomingTransaction) =>
  importTransactions(ctx, {
    svjId: house.svjId,
    bankAccountId: house.bankAccountId,
    transactions: [movement],
  });

beforeAll(async () => {
  database = await startPaymentsDb();
  ctx = (await withTestTenant()).ctx;
  house = await seedPaidHouse(ctx, 1);
}, 300_000);

afterAll(async () => {
  await database.stop();
});

describe('money leaving the account', () => {
  it('marks a posted invoice paid', async () => {
    const invoiceId = await payableInvoice('posted', '8001');

    const result = await importOne(paymentOut('8001'));

    expect(result.matchedCount).toBe(1);
    await expect(getInvoice(ctx, invoiceId)).resolves.toMatchObject({ status: 'paid' });
  });

  it('leaves an approved invoice alone until the accounting has it', async () => {
    const invoiceId = await payableInvoice('approved', '8002');

    const result = await importOne(paymentOut('8002'));

    expect(result.unmatched).toHaveLength(1);
    await expect(getInvoice(ctx, invoiceId)).resolves.toMatchObject({ status: 'approved' });
  });

  it('leaves a payment nobody expected for a person to look at', async () => {
    const result = await importOne(paymentOut('8999'));

    expect(result).toMatchObject({ matchedCount: 0 });
    expect(result.unmatched).toHaveLength(1);
  });
});
