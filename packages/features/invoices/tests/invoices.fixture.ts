import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { newId, svjIdSchema } from '../../../kernel/src/ids/index';
import {
  startTestDb,
  withTestTenant,
  type TestDatabase,
  type TestTenant,
} from '../../../kernel/src/testing/index';
import type { SupplierId } from '../domain/ids';
import type { Invoice } from '../domain/types';
import { budgetLine, contract, invoice, invoiceLine, invoiceStatusEnum, supplier } from '../schema/index';
import { createInvoice, createSupplier } from '../service/index';

export const featureSchema = {
  supplier,
  contract,
  budgetLine,
  invoice,
  invoiceLine,
  invoiceStatusEnum,
};

export const startInvoicesDb = (): Promise<TestDatabase> => startTestDb(featureSchema);

/** This feature stores an SVJ id but never joins to the table, so a fresh one is a whole house. */
export const someSvj = (): SvjId => newId(svjIdSchema);

/** And a document id: the file itself is `documents`' business, not this feature's (task 011). */
export const someDocument = (): string => newId(svjIdSchema);

let sequence = 0;

export const seedSupplier = async (ctx: RequestContext, name = 'Výtahy Praha'): Promise<SupplierId> => {
  sequence += 1;
  const created = await createSupplier(ctx, {
    name,
    ico: String(20_000_000 + sequence),
    bankAccount: '2801234567/2010',
  });
  return created.id;
};

export const receiveInvoice = (ctx: RequestContext, svjId: SvjId): Promise<Invoice> =>
  createInvoice(ctx, {
    svjId,
    documentId: someDocument(),
    source: 'email',
    receivedAt: new Date('2026-09-01T08:00:00.000Z'),
  });

export const scopedTo = (ctx: RequestContext, svjScope: readonly SvjId[]): RequestContext => ({
  ...ctx,
  svjScope,
});

export { withTestTenant };
export type { TestDatabase, TestTenant };
