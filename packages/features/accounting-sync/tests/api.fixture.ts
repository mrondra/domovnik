import * as composedSchema from '../../../db/src/schema';
import { addPerson, signIn, startApi, type ApiHarness } from '../../../../apps/api/src/tests/api.fixture';
import { getInvoice, invoiceApproved } from '../../invoices/index';
import { pohodaMock } from '../adapters/index';
import { detectConflicts, listConflicts } from '../service/index';
import { postApprovedInvoice } from '../subscribers/post-invoice';
import { approvedInvoice, deliver, linkedHouse, type LinkedHouse } from './flow.fixture';

export interface AccountingApi {
  readonly api: ApiHarness;
  readonly house: LinkedHouse;
  /** Somebody from finance, and a committee member of that one house. */
  readonly accountant: string;
  readonly chair: string;
  readonly conflictId: string;
}

/**
 * A house with one posted invoice that somebody has since changed in Pohoda — the state the screen
 * and its endpoints exist for (task 025).
 */
export const startAccountingApi = async (): Promise<AccountingApi> => {
  const api = await startApi({ ...composedSchema });
  const ctx = api.tenant.ctx;
  const house = await linkedHouse(ctx);

  const invoice = await approvedInvoice(ctx, house, '9001');
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

  const ref = (await getInvoice(ctx, invoice.id)).accountingRef ?? '';
  await pohodaMock.mutateInvoice(ctx, house.svjId, ref, { amountTotal: 10_900 });
  await detectConflicts(ctx, house.svjId);

  return {
    api,
    house,
    conflictId: (await listConflicts(ctx, house.svjId, 'open'))[0]?.id ?? '',
    accountant: await signIn(api, await addPerson(api.tenant.tenantId, 'ucetni@example.test', ['finance'])),
    chair: await signIn(
      api,
      await addPerson(api.tenant.tenantId, 'vybor@example.test', ['committee'], house.svjId),
    ),
  };
};
