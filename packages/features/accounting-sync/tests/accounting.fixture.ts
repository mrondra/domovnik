import * as composedSchema from '../../../db/src/schema';
import type { RequestContext } from '../../../kernel/src/context/index';
import { newRowId, svjIdSchema, type SvjId } from '../../../kernel/src/ids/index';
import { startTestDb, withTestTenant, type TestDatabase } from '../../../kernel/src/testing/index';
import * as accountingSchema from '../schema';
import type { PostInvoiceInput } from '../domain/types';
import { linkSvj } from '../service/index';

export const startAccountingDb = (): Promise<TestDatabase> => startTestDb({ ...accountingSchema });

/** The seed writes into houses, so that test needs the world the migrations compose. */
export const startComposedDb = (): Promise<TestDatabase> => startTestDb({ ...composedSchema });

export const someSvj = (): SvjId => svjIdSchema.parse(newRowId());

/** A house served by the demo's Pohoda; without a link nothing here is allowed to do anything. */
export const linkedSvj = async (ctx: RequestContext): Promise<SvjId> => {
  const svjId = someSvj();
  await linkSvj(ctx, { svjId, companyIco: '26512345' });
  return svjId;
};

export const someInvoice = (svjId: SvjId, externalNumber: string): PostInvoiceInput => ({
  svjId,
  invoiceId: newRowId(),
  supplier: { name: 'Výtahy Praha s.r.o.', ico: '27654321', dic: 'CZ27654321' },
  externalNumber,
  variableSymbol: externalNumber.replace(/\D/gu, ''),
  issuedOn: '2026-09-01',
  dueOn: '2026-09-30',
  amountTotal: 12_100,
  amountVat: 2100,
  currency: 'CZK',
  text: 'Revize výtahu',
});

export { withTestTenant };
export type { TestDatabase };
