import { describe, expect, it } from 'vitest';
import { invoiceDifferences } from '../domain/compare';
import type { AccountingInvoice } from '../domain/types';

const theirs: AccountingInvoice = {
  accountingRef: 'INV-1',
  externalNumber: 'F-1',
  amountTotal: 12_100,
  dueOn: '2026-09-30',
  variableSymbol: '2026001',
  paid: false,
};

const ours = { amountTotal: 12_100, dueOn: '2026-09-30', variableSymbol: '2026001' };

describe('comparing our copy with the accounting', () => {
  it('finds nothing when the two agree', () => {
    expect(invoiceDifferences(ours, theirs)).toStrictEqual([]);
  });

  it('reports an amount somebody changed in the accounting', () => {
    expect(invoiceDifferences({ ...ours, amountTotal: 10_900 }, theirs)).toStrictEqual([
      { field: 'amountTotal', ours: 10_900, theirs: 12_100 },
    ]);
  });

  it('ignores a rounding difference, which is not a disagreement', () => {
    expect(invoiceDifferences({ ...ours, amountTotal: 12_100.4 }, theirs)).toStrictEqual([]);
  });

  it('reports a due date that was moved', () => {
    expect(invoiceDifferences({ ...ours, dueOn: '2026-10-15' }, theirs)).toStrictEqual([
      { field: 'dueOn', ours: '2026-10-15', theirs: '2026-09-30' },
    ]);
  });

  it('reports a variable symbol that differs, including one the accounting does not have', () => {
    expect(invoiceDifferences(ours, { ...theirs, variableSymbol: undefined })).toStrictEqual([
      { field: 'variableSymbol', ours: '2026001', theirs: null },
    ]);
  });

  it('says nothing about a field we never filled in', () => {
    expect(
      invoiceDifferences({ amountTotal: null, dueOn: null, variableSymbol: null }, theirs),
    ).toStrictEqual([]);
  });

  it('reports every field that differs, not just the first', () => {
    const differences = invoiceDifferences(
      { amountTotal: 1, dueOn: '2026-01-01', variableSymbol: 'x' },
      theirs,
    );

    expect(differences.map((one) => one.field)).toStrictEqual(['amountTotal', 'dueOn', 'variableSymbol']);
  });
});
