import type { SvjId } from '../../../kernel/src/ids/index';

/** A day without a time zone, the way Postgres `date` stores it and an invoice prints it. */
export type IsoDay = string;

export interface AccountingParty {
  readonly name: string;
  readonly ico: string;
  readonly dic?: string | undefined;
  readonly bankAccount?: string | undefined;
}

export interface PostInvoiceInput {
  readonly svjId: SvjId;
  /** Our own id for it; Pohoda answers with its own, which is what `accountingRef` then is. */
  readonly invoiceId: string;
  readonly supplier: AccountingParty;
  readonly externalNumber: string;
  readonly variableSymbol?: string | undefined;
  readonly issuedOn: IsoDay;
  readonly dueOn: IsoDay;
  readonly amountTotal: number;
  readonly amountVat?: number | undefined;
  readonly currency: string;
  readonly text: string;
}

export interface LiquidateInput {
  readonly svjId: SvjId;
  readonly accountingRef: string;
  readonly amount: number;
  readonly paidOn: IsoDay;
  /** The bank movement that paid it, so the entry can be traced back to a statement. */
  readonly bankRef: string;
}

export interface FetchStatementsInput {
  readonly svjId: SvjId;
  readonly accountIco: string;
  readonly from: IsoDay;
  readonly to: IsoDay;
}

export interface BankStatementLine {
  readonly externalId: string;
  readonly bookedOn: IsoDay;
  readonly amount: number;
  readonly variableSymbol?: string | undefined;
  readonly counterpartyAccount?: string | undefined;
  readonly counterpartyName?: string | undefined;
  readonly message?: string | undefined;
}

/** An invoice as the accounting has it, which is what a disagreement is measured against. */
export interface AccountingInvoice {
  readonly accountingRef: string;
  readonly externalNumber: string;
  readonly amountTotal: number;
  readonly dueOn: IsoDay;
  readonly variableSymbol?: string | undefined;
  readonly paid: boolean;
}

export interface PostedInvoice {
  readonly accountingRef: string;
}

export type AccountingAdapterKind = 'mock' | 'mserver';
export type ReceivablesAdapterKind = 'internal' | 'pohoda_other_receivables';

/** Which accounting unit an SVJ is in Pohoda, and which implementations serve it (ADR 0005). */
export interface AccountingLink {
  readonly svjId: SvjId;
  readonly accountingAdapter: AccountingAdapterKind;
  readonly receivablesAdapter: ReceivablesAdapterKind;
  readonly companyIco: string;
  readonly lastSyncAt: Date | null;
  readonly config: Readonly<Record<string, unknown>> | null;
}
