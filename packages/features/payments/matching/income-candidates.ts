import type { RequestContext } from '../../../kernel/src/context/index';
import { listDebtors, type Prescription } from '../../receivables/index';
import type { BankTransaction } from '../domain/types';
import { typoDistanceWithin } from './distance';
import { fits, type Candidate } from './candidate';

const TYPO_EDITS = 1;
const JOINT_MAX = 3;

export const byTypo = (movement: BankTransaction, raised: readonly Prescription[]): readonly Candidate[] =>
  movement.variableSymbol === undefined
    ? []
    : raised.flatMap((one) =>
        typoDistanceWithin(movement.variableSymbol ?? '', one.variableSymbol, TYPO_EDITS) === TYPO_EDITS
          ? [
              {
                targetType: 'prescription' as const,
                targetId: one.id,
                amount: one.totalAmount,
                unitId: one.unitId,
                label: `Předpis ${one.variableSymbol} za ${String(one.period.month)}/${String(one.period.year)}`,
                because: 'symbol_typo' as const,
              },
            ]
          : [],
      );

/** Two or three months of the same unit, added up — somebody paying arrears in one transfer. */
export const byMonths = (
  movement: BankTransaction,
  raised: readonly Prescription[],
): readonly Candidate[] => {
  const bySymbol = new Map<string, Prescription[]>();
  for (const one of raised) {
    bySymbol.set(one.variableSymbol, [...(bySymbol.get(one.variableSymbol) ?? []), one]);
  }

  return [...bySymbol.values()].flatMap((months) => {
    const ordered = [...months].sort((a, b) => a.period.month - b.period.month);
    for (let span = 2; span <= Math.min(JOINT_MAX, ordered.length); span += 1) {
      const window = ordered.slice(0, span);
      const total = window.reduce((sum, one) => sum + one.totalAmount, 0);
      const oldest = window[0];
      if (fits(movement.amount, total) && oldest !== undefined) {
        return [
          {
            targetType: 'prescription' as const,
            targetId: oldest.id,
            amount: oldest.totalAmount,
            unitId: oldest.unitId,
            label: `${String(span)} měsíce předpisu ${oldest.variableSymbol} dohromady`,
            because: 'two_months' as const,
          },
        ];
      }
    }
    return [];
  });
};

/** A unit whose whole debt is exactly what arrived; the payer forgot the symbol, not the amount. */
export const byBalance = async (
  ctx: RequestContext,
  movement: BankTransaction,
  raised: readonly Prescription[],
): Promise<readonly Candidate[]> => {
  const debtors = await listDebtors(ctx, { svjId: movement.svjId, minDebt: 1 });

  return debtors.flatMap((debtor) => {
    if (!fits(movement.amount, -debtor.balance)) return [];
    const owed = raised.find((one) => one.unitId === debtor.unitId);
    if (owed === undefined) return [];

    return [
      {
        targetType: 'prescription' as const,
        targetId: owed.id,
        amount: owed.totalAmount,
        unitId: owed.unitId,
        label: `Jednotka se saldem ${String(debtor.balance)} Kč, předpis ${owed.variableSymbol}`,
        because: 'balance_matches' as const,
      },
    ];
  });
};
