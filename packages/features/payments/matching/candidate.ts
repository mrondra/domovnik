import type { RequestContext } from '../../../kernel/src/context/index';
import { listPrescriptions, type Period, type Prescription } from '../../receivables/index';
import type { BankTransaction, MatchTarget } from '../domain/types';
import { periodsBetween } from '../adapters/synthetic/periods';
import { TOLERANCE } from './rules';

export interface Candidate {
  readonly targetType: MatchTarget;
  readonly targetId: string;
  readonly amount: number;
  readonly label: string;
  /** Set for a prescription: the ledger entry is written against the unit that owes it. */
  readonly unitId?: string | undefined;
  /** Why the code put it on the list. The agent chooses between these; it never invents one. */
  readonly because: 'symbol_typo' | 'balance_matches' | 'two_months' | 'invoice_amount';
}

const WINDOW_MONTHS = 3;

const monthsAround = (bookedOn: string): readonly Period[] => {
  const to = bookedOn;
  const from = new Date(Date.UTC(Number(to.slice(0, 4)), Number(to.slice(5, 7)) - WINDOW_MONTHS, 1))
    .toISOString()
    .slice(0, 10);
  return periodsBetween(from, to);
};

export const nearby = async (
  ctx: RequestContext,
  movement: BankTransaction,
): Promise<readonly Prescription[]> => {
  const found: Prescription[] = [];
  for (const period of monthsAround(movement.bookedOn)) {
    found.push(...(await listPrescriptions(ctx, { svjId: movement.svjId, period })));
  }
  return found;
};

export const fits = (left: number, right: number): boolean => Math.abs(left - right) <= TOLERANCE;
