import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { listInvoices, transition } from '../service/index';
import {
  receiveInvoice,
  scopedTo,
  someSvj,
  startInvoicesDb,
  withTestTenant,
  type TestDatabase,
} from './invoices.fixture';

let database: TestDatabase;
let ctx: RequestContext;
let svjA: SvjId;
let svjB: SvjId;

beforeAll(async () => {
  database = await startInvoicesDb();
  ctx = (await withTestTenant()).ctx;
  svjA = someSvj();
  svjB = someSvj();

  const inA = await receiveInvoice(ctx, svjA);
  await transition(ctx, inA.id, 'needs_review', { reason: 'Nečitelná částka' });
  await receiveInvoice(ctx, svjA);
  await receiveInvoice(ctx, svjB);
}, 180_000);

afterAll(async () => {
  await database.stop();
});

describe('listInvoices', () => {
  it('answers every SVJ of the tenant for an actor confined to none', async () => {
    expect(await listInvoices(ctx)).toHaveLength(3);
  });

  it('answers only the SVJ the credential covers', async () => {
    const scoped = await listInvoices(scopedTo(ctx, [svjB]));

    expect(scoped).toHaveLength(1);
    expect(scoped.every((one) => one.svjId === svjB)).toBe(true);
  });

  it('answers nothing for a credential that covers nothing', async () => {
    expect(await listInvoices(scopedTo(ctx, []))).toStrictEqual([]);
  });

  it('narrows by status', async () => {
    const waiting = await listInvoices(ctx, { svjId: svjA, status: 'needs_review' });

    expect(waiting).toHaveLength(1);
    expect(waiting[0]?.status).toBe('needs_review');
  });

  it('hides an SVJ outside the scope even when it is asked for by name', async () => {
    await expect(listInvoices(scopedTo(ctx, [svjB]), { svjId: svjA })).rejects.toThrow(/SVJ nenalezeno/);
  });
});
