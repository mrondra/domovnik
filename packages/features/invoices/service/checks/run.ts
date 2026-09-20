import type { RequestContext } from '../../../../kernel/src/context/index';
import type { SvjId } from '../../../../kernel/src/ids/index';
import type { Check } from '../../domain/checks';
import type { BudgetCategory, Contract, Supplier } from '../../domain/types';
import type { ExtractedInvoice } from '../extraction/schema';
import type { InvoiceId } from '../../domain/ids';
import { amountCheck } from './amount';
import { dueSoonCheck, variableSymbolCheck } from './basics';
import { budgetCheck } from './budget';
import { contractCheck } from './contract';
import { duplicateCheck } from './duplicate';
import { supplierCheck } from './supplier';

export interface CheckSubject {
  readonly invoiceId: InvoiceId;
  readonly svjId: SvjId;
  readonly extracted: ExtractedInvoice;
  readonly supplier: Supplier | null;
  readonly contracts: readonly Contract[];
  readonly budgetCategory: BudgetCategory | null;
  readonly now: Date;
}

/**
 * Everything the platform can decide on its own, in one pass. What survives it is the residual the
 * agent is asked about (ADR 0004) — so a rule that could be written here belongs here and not in a
 * prompt.
 */
export const runChecks = async (ctx: RequestContext, subject: CheckSubject): Promise<readonly Check[]> => {
  const { extracted, supplier, contracts } = subject;

  const results = [
    supplierCheck(extracted, supplier),
    contractCheck(supplier, contracts),
    amountCheck(extracted, contracts),
    await budgetCheck(ctx, subject.svjId, subject.budgetCategory, extracted),
    await duplicateCheck(ctx, subject.invoiceId, supplier, extracted),
    dueSoonCheck(extracted, subject.now),
    variableSymbolCheck(extracted),
  ];

  return results.filter((check): check is Check => check !== null);
};
