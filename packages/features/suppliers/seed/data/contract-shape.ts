import type { Specialization } from '../../domain/specializations';
import type { BudgetCategory } from '../../domain/types';

export interface DemoContract {
  readonly supplier: string;
  readonly subject: string;
  readonly budgetCategory: BudgetCategory;
  /** `null` is a one-off job rather than a standing arrangement — the roofer, for instance. */
  readonly monthlyAmount: number | null;
  /** Obory this particular agreement covers; what `contractedSupplierFor` (task 030) filters on. */
  readonly covers?: readonly Specialization[] | undefined;
}
