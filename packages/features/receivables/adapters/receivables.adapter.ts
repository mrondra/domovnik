import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { UnitId } from '../../svj/index';
import type { Period } from '../domain/period';
import type { EntryReference, Prescription, PrescriptionPlan, UnitBalance } from '../domain/types';

export type ReceivablesAdapterKind = 'internal' | 'pohoda';

export interface ListPrescriptionsInput {
  readonly svjId: SvjId;
  readonly period: Period;
}

export interface FindByVariableSymbolInput {
  readonly svjId: SvjId;
  readonly variableSymbol: string;
  readonly period?: Period | undefined;
}

export interface UnitBalanceInput {
  readonly svjId: SvjId;
  readonly unitId: UnitId;
  readonly asOf?: Date | undefined;
}

export interface ListDebtorsInput {
  readonly svjId: SvjId;
  /** In crowns: a unit owing less than this is not a debtor worth naming. */
  readonly minDebt: number;
}

export interface RecordPaymentInput {
  readonly svjId: SvjId;
  readonly unitId: UnitId;
  readonly amount: number;
  readonly paidOn: Date;
  readonly reference: EntryReference;
}

export interface GeneratePrescriptionsInput {
  readonly svjId: SvjId;
  readonly period: Period;
  readonly plan: PrescriptionPlan;
}

/**
 * Where prescriptions and balances come from for one SVJ (ADR 0005). Pohoda has no SVJ module and
 * every management company keeps this differently, so it is a port with several implementations —
 * our own records, *Ostatní pohledávky* in Pohoda, a specialised system later.
 */
export interface ReceivablesAdapter {
  readonly kind: ReceivablesAdapterKind;
  listPrescriptions(ctx: RequestContext, input: ListPrescriptionsInput): Promise<readonly Prescription[]>;
  findByVariableSymbol(ctx: RequestContext, input: FindByVariableSymbolInput): Promise<Prescription | null>;
  unitBalance(ctx: RequestContext, input: UnitBalanceInput): Promise<UnitBalance>;
  listDebtors(ctx: RequestContext, input: ListDebtorsInput): Promise<readonly UnitBalance[]>;
  recordPayment(ctx: RequestContext, input: RecordPaymentInput): Promise<void>;
}

/** Only our own records can raise a prescription; an imported one is written where it came from. */
export interface GeneratingReceivablesAdapter extends ReceivablesAdapter {
  readonly kind: 'internal';
  generatePrescriptions(
    ctx: RequestContext,
    input: GeneratePrescriptionsInput,
  ): Promise<readonly Prescription[]>;
}
