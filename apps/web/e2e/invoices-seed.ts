import type { RequestContext } from '../../../packages/kernel/src/context/index';
import type { SvjId } from '../../../packages/kernel/src/ids/index';
import { storeDocument } from '../../../packages/features/documents/index';
import { InvoicesService, type InvoiceId } from '../../../packages/features/invoices/index';

export const INVOICE_NUMBER = '2026-0777';

const invoices = new InvoicesService();

/**
 * An invoice as the deterministic half of the platform would have left it: read, matched to a
 * contract and checked. It is written through the same service calls production uses, so the
 * screens under test see what they will see in production — only the model is missing (task 018).
 */
export const seedExtractedInvoice = async (ctx: RequestContext, svjId: SvjId): Promise<InvoiceId> => {
  const supplier = await invoices.createSupplier(ctx, {
    name: 'Úklid Praha s.r.o.',
    ico: '27000111',
  });
  await invoices.createContract(ctx, {
    svjId,
    supplierId: supplier.id,
    subject: 'Úklid společných prostor',
    budgetCategory: 'uklid',
    monthlyAmount: 15_000,
    validFrom: '2026-01-01',
  });
  await invoices.setBudgetLine(ctx, {
    svjId,
    year: 2026,
    category: 'uklid',
    plannedAmount: 200_000,
  });

  const document = await storeDocument(ctx, {
    svjId,
    title: `Faktura ${INVOICE_NUMBER}`,
    category: 'invoice',
    body: Buffer.from(`Faktura ${INVOICE_NUMBER}`),
    contentType: 'application/pdf',
    source: 'email',
    filename: 'faktura.pdf',
  });

  const received = await invoices.createInvoice(ctx, {
    svjId,
    documentId: document.id,
    source: 'email',
    receivedAt: new Date(),
  });

  await invoices.transition(ctx, received.id, 'extracted', {
    supplierId: supplier.id,
    externalNumber: INVOICE_NUMBER,
    variableSymbol: '20260777',
    issuedOn: '2026-09-01',
    dueOn: '2026-09-30',
    amountTotal: 15_000,
    amountVat: 2603.31,
    budgetCategory: 'uklid',
    checks: { results: [{ code: 'due_soon', severity: 'info', message: 'Splatnost se blíží.' }] },
  });

  return received.id;
};
