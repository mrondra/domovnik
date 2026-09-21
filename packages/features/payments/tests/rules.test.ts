import { describe, expect, it } from 'vitest';
import { decideExpense, decideIncome, isIncome, TOLERANCE } from '../matching/index';
import type { InvoiceCandidate, MatchCandidate } from '../matching/index';

const OWED = 3300;
const prescription: MatchCandidate = { id: '01a0be4a-0000-7000-8000-000000000001', amount: OWED };

const invoice = (status: string, amount = 12_100): InvoiceCandidate => ({
  id: '01a0be4a-0000-7000-8000-000000000002',
  amount,
  status,
});

interface IncomeCase {
  readonly name: string;
  readonly paid: number;
  readonly candidate: MatchCandidate | null;
  readonly expected: { readonly kind: string; readonly hint?: string; readonly method?: string };
}

const INCOME: readonly IncomeCase[] = [
  {
    name: 'the exact amount against the symbol',
    paid: OWED,
    candidate: prescription,
    expected: { kind: 'matched', method: 'vs_amount' },
  },
  {
    name: 'half a crown over, which is the bank rounding',
    paid: OWED + 0.5,
    candidate: prescription,
    expected: { kind: 'matched', method: 'vs_amount' },
  },
  {
    name: 'a crown under, which is still nobody disagreeing',
    paid: OWED - TOLERANCE,
    candidate: prescription,
    expected: { kind: 'matched', method: 'vs_amount' },
  },
  {
    name: 'two crowns over, which somebody meant',
    paid: OWED + 2,
    candidate: prescription,
    expected: { kind: 'residual', hint: 'vs_only' },
  },
  {
    name: 'twice the amount, which is two months at once',
    paid: OWED * 2,
    candidate: prescription,
    expected: { kind: 'residual', hint: 'vs_only' },
  },
  {
    name: 'part of the amount',
    paid: OWED / 2,
    candidate: prescription,
    expected: { kind: 'residual', hint: 'vs_only' },
  },
  {
    name: 'a symbol nobody was given',
    paid: OWED,
    candidate: null,
    expected: { kind: 'residual', hint: 'vs_unknown' },
  },
];

describe.each(INCOME)('money in: $name', ({ paid, candidate, expected }) => {
  it('is decided without asking anyone', () => {
    expect(decideIncome(paid, candidate)).toMatchObject(expected);
  });
});

describe('money out', () => {
  it('settles a posted invoice of the same amount', () => {
    expect(decideExpense(-12_100, invoice('posted'))).toMatchObject({
      kind: 'matched',
      targetType: 'invoice',
      amount: 12_100,
      method: 'vs_amount',
    });
  });

  it('leaves an approved invoice alone until it has been posted', () => {
    expect(decideExpense(-12_100, invoice('approved'))).toMatchObject({
      kind: 'residual',
      hint: 'invoice_not_posted',
    });
  });

  it('does not settle an invoice for a different amount', () => {
    expect(decideExpense(-9000, invoice('posted'))).toMatchObject({
      kind: 'residual',
      hint: 'vs_only',
    });
  });

  it('has nothing to settle against an unknown symbol', () => {
    expect(decideExpense(-12_100, null)).toMatchObject({ kind: 'residual', hint: 'vs_unknown' });
  });
});

describe('which way the money went', () => {
  it('is the sign the statement itself used', () => {
    expect([isIncome(1), isIncome(-1), isIncome(0)]).toStrictEqual([true, false, false]);
  });
});
