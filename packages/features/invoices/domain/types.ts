import type { AgentRunId, ApprovalId, SvjId } from '../../../kernel/src/ids/index';
import type { IsoDay } from './day';
import type { ContractId, InvoiceId, SupplierId } from './ids';
import type { InvoiceStatus } from './status';

/** The budget categories of zadání kap. 4; a contract and an invoice both name one of these. */
export type BudgetCategory =
  'uklid' | 'vytah' | 'energie' | 'opravy' | 'revize' | 'sprava' | 'pojisteni' | 'ostatni';

export interface Supplier {
  readonly id: SupplierId;
  readonly name: string;
  readonly ico: string;
  readonly dic: string | null;
  readonly bankAccount: string | null;
  readonly email: string | null;
}

export interface Contract {
  readonly id: ContractId;
  readonly svjId: SvjId;
  readonly supplierId: SupplierId;
  readonly subject: string;
  readonly budgetCategory: BudgetCategory;
  readonly monthlyAmount: number | null;
  readonly validFrom: IsoDay;
  readonly validTo: IsoDay | null;
  readonly documentId: string | null;
}

/** What is left of the budget after everything already approved is counted against it. */
export interface BudgetStatus {
  readonly svjId: SvjId;
  readonly year: number;
  readonly category: BudgetCategory;
  readonly planned: number;
  readonly spent: number;
  readonly remaining: number;
}

export interface Invoice {
  readonly id: InvoiceId;
  readonly svjId: SvjId;
  readonly status: InvoiceStatus;
  readonly supplierId: SupplierId | null;
  readonly contractId: ContractId | null;
  readonly documentId: string;
  readonly externalNumber: string | null;
  readonly variableSymbol: string | null;
  readonly issuedOn: IsoDay | null;
  readonly dueOn: IsoDay | null;
  readonly amountTotal: number | null;
  readonly amountVat: number | null;
  readonly currency: string;
  readonly budgetCategory: BudgetCategory | null;
  readonly extraction: unknown;
  readonly checks: unknown;
  readonly agentRunId: AgentRunId | null;
  readonly approvalId: ApprovalId | null;
  readonly accountingRef: string | null;
  /** An instant, not a day, written the way it crosses the wire (task 018). */
  readonly receivedAt: string;
  readonly source: string;
}

/** What a step of the state machine may change along the way; the status itself is not in here. */
export interface InvoicePatch {
  readonly supplierId?: SupplierId | undefined;
  readonly contractId?: ContractId | undefined;
  readonly externalNumber?: string | undefined;
  readonly variableSymbol?: string | undefined;
  readonly issuedOn?: IsoDay | undefined;
  readonly dueOn?: IsoDay | undefined;
  readonly amountTotal?: number | undefined;
  readonly amountVat?: number | undefined;
  readonly currency?: string | undefined;
  readonly budgetCategory?: BudgetCategory | undefined;
  readonly extraction?: unknown;
  readonly checks?: unknown;
  readonly agentRunId?: AgentRunId | undefined;
  readonly approvalId?: ApprovalId | undefined;
  readonly accountingRef?: string | undefined;
  /** Why the step is being taken — it goes into the audit row and nowhere else. */
  readonly reason?: string | undefined;
}
