import type { RequestContext } from '../../../kernel/src/context/index';
import type {
  AccountingInvoice,
  AccountingParty,
  BankStatementLine,
  FetchStatementsInput,
  LiquidateInput,
  PostInvoiceInput,
  PostedInvoice,
} from '../domain/types';

export interface UpsertSupplierInput extends AccountingParty {
  readonly svjId: PostInvoiceInput['svjId'];
}

/**
 * What the accounting can be asked to do (ADR 0005). Pohoda is the source of truth: we tell it
 * about an invoice somebody approved and about money that arrived, and we read back what it says —
 * we never decide on its behalf.
 *
 * Two implementations: an in-memory Pohoda the demo runs on, and mServer talking to a real one.
 * The contract test in `tests/` is the same suite for both.
 */
export interface AccountingAdapter {
  readonly kind: 'mock' | 'mserver';
  postReceivedInvoice(ctx: RequestContext, input: PostInvoiceInput): Promise<PostedInvoice>;
  liquidateInvoice(ctx: RequestContext, input: LiquidateInput): Promise<void>;
  fetchBankStatements(
    ctx: RequestContext,
    input: FetchStatementsInput,
  ): Promise<readonly BankStatementLine[]>;
  fetchInvoice(
    ctx: RequestContext,
    svjId: PostInvoiceInput['svjId'],
    accountingRef: string,
  ): Promise<AccountingInvoice | null>;
  upsertSupplier(ctx: RequestContext, input: UpsertSupplierInput): Promise<PostedInvoice>;
}
