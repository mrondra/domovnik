import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { storeDocument } from '../../documents/index';
import type { SupplierId } from '../domain/ids';
import { budgetStatus, createInvoice, transition } from '../service/index';
import { DEMO_BUDGETS } from './data/budget';
import { invoicePdf } from './pdf/invoice-pdf';

const HALLERS = 100;

/**
 * A budget line that is meant to be nearly spent is spent for real: one invoice, approved, for the
 * amount the plan says is gone. `budgetStatus` computes the remainder from approved invoices, so a
 * number written straight into the plan would be a remainder nobody could account for (task 019).
 */
export const seedSpentBudget = async (
  ctx: RequestContext,
  svjId: SvjId,
  house: number,
  year: number,
  supplierId: SupplierId,
  customer: string,
): Promise<void> => {
  for (const demo of DEMO_BUDGETS[house] ?? []) {
    if (demo.spentRatio === undefined) continue;

    const status = await budgetStatus(ctx, { svjId, year, category: demo.category });
    if (status.spent > 0) continue;

    const amount = Math.round(demo.plannedAmount * demo.spentRatio * HALLERS) / HALLERS;
    const number = `${String(year)}-H${demo.category}`;

    const document = await storeDocument(ctx, {
      svjId,
      title: `Faktura ${number}`,
      category: 'invoice',
      body: await invoicePdf({
        number,
        supplierName: 'Strechy Novotny s.r.o.',
        supplierIco: '27770540',
        bankAccount: '3201234571/2010',
        customer,
        issuedOn: `${String(year)}-03-15`,
        dueOn: `${String(year)}-04-15`,
        variableSymbol: `${String(year)}0001`,
        lines: [{ description: 'Rekonstrukce ploche strechy - 1. etapa', amount }],
        total: amount,
        vat: Math.round(amount * (0.21 / 1.21) * HALLERS) / HALLERS,
      }),
      contentType: 'application/pdf',
      source: 'seed',
      filename: 'faktura.pdf',
    });

    const received = await createInvoice(ctx, {
      svjId,
      documentId: document.id,
      source: 'seed',
      receivedAt: new Date(`${String(year)}-03-16T08:00:00.000Z`),
    });

    await transition(ctx, received.id, 'extracted', {
      supplierId,
      externalNumber: number,
      issuedOn: `${String(year)}-03-15`,
      dueOn: `${String(year)}-04-15`,
      amountTotal: amount,
      budgetCategory: demo.category,
      reason: 'Historická faktura z demo dat',
    });
    await transition(ctx, received.id, 'pending_approval');
    await transition(ctx, received.id, 'approved', { reason: 'Schváleno výborem (demo historie)' });
  }
};
