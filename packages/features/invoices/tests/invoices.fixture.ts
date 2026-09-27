import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { newId, svjIdSchema } from '../../../kernel/src/ids/index';
import {
  startTestDb,
  withTestTenant,
  type TestDatabase,
  type TestTenant,
} from '../../../kernel/src/testing/index';
import { supplierIdSchema, type SupplierId } from '../../suppliers/index';
import type { Invoice } from '../domain/types';
import { budgetLine, invoice, invoiceLine, invoiceStatusEnum } from '../schema/index';
import { createInvoice } from '../service/index';

export const featureSchema = {
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

/**
 * `invoice.supplierId` carries no foreign key to `suppliers`' own table (features never join
 * across a table boundary, ADR 0002) — a fresh id is exactly as good as a persisted supplier for
 * a test that never asks `suppliers` about it.
 */
export const someSupplierId = (): SupplierId => newId(supplierIdSchema);

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
