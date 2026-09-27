import type { SvjId } from '../../../kernel/src/ids/index';
import type { IsoDay } from './day';
import type { ContractId, SupplierId } from './ids';

/** The budget categories of zadání kap. 4; a contract names one, and `invoices` reuses it. */
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
