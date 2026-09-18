import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { DomainError, NotFoundError } from '../../../kernel/src/errors/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { SupplierId } from '../domain/ids';
import { getInvoice, transition } from '../service/index';
import { auditActions } from './audit.fixture';
import {
  receiveInvoice,
  scopedTo,
  seedSupplier,
  someSvj,
  startInvoicesDb,
  withTestTenant,
  type TestDatabase,
} from './invoices.fixture';

let database: TestDatabase;
let ctx: RequestContext;
let svjA: SvjId;
let svjB: SvjId;
let supplierId: SupplierId;

beforeAll(async () => {
  database = await startInvoicesDb();
  ctx = (await withTestTenant()).ctx;
  svjA = someSvj();
  svjB = someSvj();
  supplierId = await seedSupplier(ctx);
}, 180_000);

afterAll(async () => {
  await database.stop();
});

/** What extraction would have filled in (task 016); enough to approve and to post. */
const extracted = (): Record<string, unknown> => ({
  supplierId,
  amountTotal: 12_100,
  dueOn: '2026-09-30',
  variableSymbol: '2026001',
});

describe('createInvoice', () => {
  it('starts an invoice at received and says so', async () => {
    const received = await receiveInvoice(ctx, svjA);

    expect(received).toMatchObject({ status: 'received', source: 'email', currency: 'CZK' });
    await expect(auditActions(ctx, received.id)).resolves.toStrictEqual(['finance.invoice.received']);
  });

  it('hides an invoice of an SVJ outside the scope of the credential', async () => {
    const received = await receiveInvoice(ctx, svjA);

    await expect(getInvoice(scopedTo(ctx, [svjB]), received.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('transition', () => {
  it('walks an invoice all the way to paid, auditing every step', async () => {
    const received = await receiveInvoice(ctx, svjA);

    await transition(ctx, received.id, 'extracted', extracted());
    await transition(ctx, received.id, 'pending_approval');
    await transition(ctx, received.id, 'approved', { reason: 'Schváleno výborem' });
    await transition(ctx, received.id, 'posted', { accountingRef: 'POHODA-42' });
    const paid = await transition(ctx, received.id, 'paid');

    expect(paid.status).toBe('paid');
    await expect(auditActions(ctx, received.id)).resolves.toStrictEqual([
      'finance.invoice.received',
      'finance.invoice.extracted',
      'finance.invoice.pending_approval',
      'finance.invoice.approved',
      'finance.invoice.posted',
      'finance.invoice.paid',
    ]);
  });

  it('refuses a step the machine does not allow, and changes nothing', async () => {
    const received = await receiveInvoice(ctx, svjA);

    await expect(transition(ctx, received.id, 'paid')).rejects.toMatchObject({
      code: 'invoice_transition_invalid',
    });
    await expect(getInvoice(ctx, received.id)).resolves.toMatchObject({ status: 'received' });
  });

  it('refuses to approve an invoice nobody could pay', async () => {
    const received = await receiveInvoice(ctx, svjA);
    await transition(ctx, received.id, 'extracted');
    await transition(ctx, received.id, 'pending_approval');

    await expect(transition(ctx, received.id, 'approved')).rejects.toBeInstanceOf(DomainError);
    await expect(getInvoice(ctx, received.id)).resolves.toMatchObject({ status: 'pending_approval' });
  });

  it('refuses to post an invoice without the id it got in Pohoda', async () => {
    const received = await receiveInvoice(ctx, svjA);
    await transition(ctx, received.id, 'extracted', extracted());
    await transition(ctx, received.id, 'pending_approval');
    await transition(ctx, received.id, 'approved');

    await expect(transition(ctx, received.id, 'posted')).rejects.toMatchObject({
      code: 'invoice_incomplete',
    });
  });
});
