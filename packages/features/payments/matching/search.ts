import type { RequestContext } from '../../../kernel/src/context/index';
import { listInvoices } from '../../invoices/index';
import type { BankTransaction } from '../domain/types';
import { fits, nearby, type Candidate } from './candidate';
import { byBalance, byMonths, byTypo } from './income-candidates';

const byInvoice = async (ctx: RequestContext, movement: BankTransaction): Promise<readonly Candidate[]> => {
  const posted = await listInvoices(ctx, { svjId: movement.svjId, status: 'posted' });

  return posted.flatMap((invoice) =>
    invoice.amountTotal !== null && fits(Math.abs(movement.amount), invoice.amountTotal)
      ? [
          {
            targetType: 'invoice' as const,
            targetId: invoice.id,
            amount: invoice.amountTotal,
            label: `Faktura ${invoice.externalNumber ?? invoice.id} na ${String(invoice.amountTotal)} Kč`,
            because: 'invoice_amount' as const,
          },
        ]
      : [],
  );
};

/**
 * Everything this movement could plausibly be about, worked out by code. The agent picks from this
 * list and says why; it never proposes a target that is not on it (ADR 0004, task 022) — which is
 * also what makes a wrong proposal a bug in these rules rather than a model having a bad day.
 */
export const candidatesFor = async (
  ctx: RequestContext,
  movement: BankTransaction,
): Promise<readonly Candidate[]> => {
  if (movement.amount < 0) return byInvoice(ctx, movement);

  const raised = await nearby(ctx, movement);
  const found = [
    ...byTypo(movement, raised),
    ...byMonths(movement, raised),
    ...(await byBalance(ctx, movement, raised)),
  ];

  const seen = new Set<string>();
  return found.filter((one) => {
    const key = `${one.because}:${one.targetId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
