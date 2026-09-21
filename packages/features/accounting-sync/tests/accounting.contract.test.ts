import { afterAll, beforeAll, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { describeAdapterContract } from '../../../kernel/src/testing/index';
import type { AccountingAdapter } from '../adapters/index';
import { pohodaMock } from '../adapters/index';
import {
  linkedSvj,
  someInvoice,
  startAccountingDb,
  withTestTenant,
  type TestDatabase,
} from './accounting.fixture';

let database: TestDatabase;
let ctx: RequestContext;
let svjId: SvjId;

beforeAll(async () => {
  database = await startAccountingDb();
  ctx = (await withTestTenant()).ctx;
  svjId = await linkedSvj(ctx);
}, 300_000);

afterAll(async () => {
  await database.stop();
});

/**
 * One suite, both implementations. The real one is not here: mServer is unverified against a real
 * Pohoda (ADR 0005), so there is nothing to run it against and `adapters/resolve.ts` refuses to
 * serve an SVJ through it. When that changes, `real` is added and this suite is what it answers.
 */
describeAdapterContract<AccountingAdapter>(
  {
    name: 'the accounting',
    mock: () => pohodaMock,
    realEnabledBy: 'POHODA_MSERVER_URL',
  },
  (adapter) => {
    it('gives back the invoice it was told about', async () => {
      const invoice = someInvoice(svjId, '2026-000412');

      const { accountingRef } = await adapter().postReceivedInvoice(ctx, invoice);

      await expect(adapter().fetchInvoice(ctx, svjId, accountingRef)).resolves.toStrictEqual({
        accountingRef,
        externalNumber: invoice.externalNumber,
        amountTotal: invoice.amountTotal,
        dueOn: invoice.dueOn,
        variableSymbol: invoice.variableSymbol,
        paid: false,
      });
    });

    it('holds one invoice when the same one is sent twice', async () => {
      const invoice = someInvoice(svjId, '2026-000500');

      const first = await adapter().postReceivedInvoice(ctx, invoice);
      const again = await adapter().postReceivedInvoice(ctx, { ...invoice, amountTotal: 999 });

      expect(again.accountingRef).toBe(first.accountingRef);
      await expect(adapter().fetchInvoice(ctx, svjId, first.accountingRef)).resolves.toMatchObject({
        amountTotal: 12_100,
      });
    });

    it('knows nothing about a reference it was never given', async () => {
      await expect(adapter().fetchInvoice(ctx, svjId, 'INV-neexistuje')).resolves.toBeNull();
    });

    it('reports an invoice paid once it has been settled', async () => {
      const { accountingRef } = await adapter().postReceivedInvoice(ctx, someInvoice(svjId, '2026-000600'));

      await adapter().liquidateInvoice(ctx, {
        svjId,
        accountingRef,
        amount: 12_100,
        paidOn: '2026-09-20',
        bankRef: 'stk-1',
      });

      await expect(adapter().fetchInvoice(ctx, svjId, accountingRef)).resolves.toMatchObject({ paid: true });
    });

    it('hands over statement lines that are the same lines when asked again', async () => {
      const range = { svjId, accountIco: '26512345', from: '2026-09-01', to: '2026-09-30' } as const;

      const first = await adapter().fetchBankStatements(ctx, range);
      const again = await adapter().fetchBankStatements(ctx, range);

      expect(first.length).toBeGreaterThan(0);
      expect(again.map((line) => line.externalId)).toStrictEqual(first.map((line) => line.externalId));
    });

    it('remembers the supplier it was given', async () => {
      const supplier = { svjId, name: 'Beran & syn', ico: '12345678' };

      const { accountingRef } = await adapter().upsertSupplier(ctx, supplier);

      expect(accountingRef).toMatch(/^ADB-/u);
    });
  },
);
