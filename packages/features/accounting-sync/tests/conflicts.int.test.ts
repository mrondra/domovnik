import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { schema, withTenant } from '../../../kernel/src/db/index';
import { eq } from 'drizzle-orm';
import { getInvoice, invoiceApproved, type InvoiceId } from '../../invoices/index';
import { pohodaMock } from '../adapters/index';
import { syncConflictDetected } from '../domain/events';
import { detectConflicts, listConflicts, resolveConflict } from '../service/index';
import { compareWithAccounting } from '../subscribers/tick-daily';
import { postApprovedInvoice } from '../subscribers/post-invoice';
import { startComposedDb, withTestTenant, type TestDatabase } from './accounting.fixture';
import { approvedInvoice, deliver, linkedHouse, type LinkedHouse } from './flow.fixture';

let database: TestDatabase;
let ctx: RequestContext;
let house: LinkedHouse;
let invoiceId: InvoiceId;
let accountingRef: string;

const events = (): Promise<number> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select().from(schema.event).where(eq(schema.event.name, syncConflictDetected.name));
    return rows.length;
  });

beforeAll(async () => {
  database = await startComposedDb();
  ctx = (await withTestTenant()).ctx;
  house = await linkedHouse(ctx);

  const invoice = await approvedInvoice(ctx, house, '7001');
  invoiceId = invoice.id;
  await deliver(ctx, postApprovedInvoice.handler, {
    name: invoiceApproved.name,
    version: invoiceApproved.version,
    payload: {
      invoiceId,
      svjId: house.svjId,
      supplierId: house.svjId,
      amountTotal: invoice.amountTotal,
      dueOn: invoice.dueOn,
      variableSymbol: invoice.variableSymbol,
      budgetCategory: null,
    },
  });
  accountingRef = (await getInvoice(ctx, invoiceId)).accountingRef ?? '';
}, 300_000);

afterAll(async () => {
  await database.stop();
});

describe('reading posted invoices back out of the accounting', () => {
  it('finds nothing while the two copies agree', async () => {
    await expect(detectConflicts(ctx, house.svjId)).resolves.toStrictEqual([]);
  });

  it('records what somebody changed in Pohoda, and changes neither side', async () => {
    await pohodaMock.mutateInvoice(ctx, house.svjId, accountingRef, { amountTotal: 10_900 });

    const found = await detectConflicts(ctx, house.svjId);

    expect(found).toHaveLength(1);
    await expect(listConflicts(ctx, house.svjId, 'open')).resolves.toMatchObject([
      { entityType: 'invoice', entityId: invoiceId, field: 'amountTotal', ours: 12_100, theirs: 10_900 },
    ]);
    await expect(getInvoice(ctx, invoiceId)).resolves.toMatchObject({ amountTotal: 12_100 });
  });

  it('tells the agent once, with the whole batch', async () => {
    await expect(events()).resolves.toBe(1);
  });

  it('opens the same disagreement only once, however often it sweeps', async () => {
    await expect(detectConflicts(ctx, house.svjId)).resolves.toStrictEqual([]);
    await deliver(ctx, compareWithAccounting.handler, {
      name: 'tick.daily',
      version: 1,
      payload: { at: '2026-09-21T00:00:00.000Z' },
    });

    await expect(listConflicts(ctx, house.svjId, 'open')).resolves.toHaveLength(1);
    await expect(events()).resolves.toBe(1);
  });

  it('closes on a decision, which writes over neither copy', async () => {
    const open = await listConflicts(ctx, house.svjId, 'open');
    const conflictId = open[0]?.id;
    if (conflictId === undefined) throw new RangeError('conflict');

    const resolved = await resolveConflict(ctx, {
      conflictId,
      resolution: 'take_theirs',
      note: 'Účetní fakturu opravila podle papírového dokladu.',
    });

    expect(resolved.status).toBe('resolved');
    expect(resolved.resolution).toContain('Platí hodnota z Pohody');
    await expect(listConflicts(ctx, house.svjId, 'open')).resolves.toStrictEqual([]);
    await expect(getInvoice(ctx, invoiceId)).resolves.toMatchObject({ amountTotal: 12_100 });
  });
});
