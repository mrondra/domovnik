import type { SvjId } from '../../../kernel/src/ids/index';
import type { BankAccountId, BankTransactionId } from './ids';

export type MatchStatus = 'unmatched' | 'matched' | 'proposed' | 'ignored';
export type MatchTarget = 'prescription' | 'invoice';
export type MatchMethod = 'vs_amount' | 'vs_only' | 'agent' | 'manual';

/** A day without a time zone, the way Postgres `date` stores it and a statement prints it. */
export type IsoDay = string;

export interface BankAccount {
  readonly id: BankAccountId;
  readonly svjId: SvjId;
  readonly iban: string | null;
  readonly number: string;
  readonly bankCode: string;
  readonly label: string;
  readonly isPrimary: boolean;
}

/** One movement as the source handed it over, before it is anything of ours. */
export interface IncomingTransaction {
  readonly externalId: string;
  readonly bookedOn: IsoDay;
  readonly amount: number;
  readonly counterpartyAccount?: string | undefined;
  readonly counterpartyName?: string | undefined;
  readonly variableSymbol?: string | undefined;
  readonly specificSymbol?: string | undefined;
  readonly message?: string | undefined;
}

export interface BankTransaction extends IncomingTransaction {
  readonly id: BankTransactionId;
  readonly svjId: SvjId;
  readonly bankAccountId: BankAccountId;
  readonly matchStatus: MatchStatus;
}

export interface ImportResult {
  readonly count: number;
  readonly newCount: number;
  readonly matchedCount: number;
  /** What no rule could settle; it is what the agent is asked about, in one batch (ADR 0004). */
  readonly unmatched: readonly BankTransactionId[];
}
