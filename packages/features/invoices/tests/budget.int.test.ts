import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { SupplierId } from '../domain/ids';
import { budgetStatus, setBudgetLine, transition } from '../service/index';
import {
  receiveInvoice,
  seedSupplier,
  someSvj,
  startInvoicesDb,
  withTestTenant,
  type TestDatabase,
} from './invoices.fixture';

const YEAR = 2026;
const LINE = { year: YEAR, category: 'opravy' } as const;

let database: TestDatabase;
let ctx: RequestContext;
let svjId: SvjId;
let supplierId: SupplierId;

beforeAll(async () => {
  database = await startInvoicesDb();
  ctx = (await withTestTenant()).ctx;
  svjId = someSvj();
  supplierId = await seedSupplier(ctx);
}, 180_000);

afterAll(async () => {
  await database.stop();
});

/** One invoice for 30 000 Kč, taken as far as the caller asks for. */
const spend = async (upTo: 'pending_approval' | 'approved'): Promise<void> => {
  const received = await receiveInvoice(ctx, svjId);
  await transition(ctx, received.id, 'extracted', {
    supplierId,
    amountTotal: 30_000,
    issuedOn: '2026-04-01',
    dueOn: '2026-04-30',
    budgetCategory: 'opravy',
  });
  await transition(ctx, received.id, 'pending_approval');
  if (upTo === 'approved') await transition(ctx, received.id, 'approved');
};

describe('budgetStatus', () => {
  it('counts what was planned against what was approved', async () => {
    await setBudgetLine(ctx, { svjId, ...LINE, plannedAmount: 100_000 });
    await spend('approved');

    await expect(budgetStatus(ctx, { svjId, ...LINE })).resolves.toMatchObject({
      planned: 100_000,
      spent: 30_000,
      remaining: 70_000,
    });
  });

  it('does not count an invoice nobody has approved yet', async () => {
    await spend('pending_approval');

    await expect(budgetStatus(ctx, { svjId, ...LINE })).resolves.toMatchObject({ spent: 30_000 });
  });

  it('takes a second plan for the same line as a correction', async () => {
    await setBudgetLine(ctx, { svjId, ...LINE, plannedAmount: 120_000 });

    await expect(budgetStatus(ctx, { svjId, ...LINE })).resolves.toMatchObject({ planned: 120_000 });
  });

  it('answers a line nobody planned as zero rather than as missing', async () => {
    await expect(budgetStatus(ctx, { svjId, year: YEAR, category: 'revize' })).resolves.toMatchObject({
      planned: 0,
      spent: 0,
      remaining: 0,
    });
  });
});
