import type { RequestContext } from '../../../kernel/src/context/index';
import { getInvoice, type InvoiceId } from '../../invoices/index';
import { accountingAdapterFor } from '../adapters/index';
import type { IsoDay } from '../domain/types';
import { jobDone, runJob } from './jobs';

export interface LiquidateInvoiceInput {
  readonly invoiceId: InvoiceId;
  readonly amount: number;
  readonly paidOn: IsoDay;
  /** The bank movement that paid it, so the entry can be traced back to a statement. */
  readonly bankRef: string;
}

/**
 * Money that left the account, told to the accounting as the settlement of an invoice it already
 * has. An invoice nobody posted is not settled here: Pohoda cannot liquidate a document it was
 * never given, and inventing one to hang the payment on is exactly the silent divergence ADR 0005
 * is about.
 *
 * Idempotent by the job: a redelivered `finance.payment.matched` finds this one done.
 */
export const liquidateInvoice = async (
  ctx: RequestContext,
  input: LiquidateInvoiceInput,
): Promise<boolean> => {
  const invoice = await getInvoice(ctx, input.invoiceId);
  if (invoice.accountingRef === null) return false;
  if (await jobDone(ctx, invoice.svjId, 'liquidate', input.invoiceId)) return true;

  const adapter = await accountingAdapterFor(ctx, invoice.svjId);
  const accountingRef = invoice.accountingRef;

  return runJob(
    ctx,
    {
      svjId: invoice.svjId,
      kind: 'liquidate',
      payload: { entityId: input.invoiceId, bankRef: input.bankRef },
    },
    async () => {
      await adapter.liquidateInvoice(ctx, {
        svjId: invoice.svjId,
        accountingRef,
        amount: input.amount,
        paidOn: input.paidOn,
        bankRef: input.bankRef,
      });

      return { result: { accountingRef, paidOn: input.paidOn }, value: true };
    },
  );
};
