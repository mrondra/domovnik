import { describe, expect, it } from 'vitest';
import type { Contract } from '../domain/types';
import {
  amountCheck,
  contractCheck,
  dueSoonCheck,
  supplierCheck,
  variableSymbolCheck,
} from '../service/checks/index';
import { scenarioNamed } from './fixtures/invoice-scenarios.fixture';
import { aContract, aSupplier } from './fixtures/records.fixture';

const AS_AGREED = scenarioNamed('as-agreed').extracted;
const ABOVE = scenarioNamed('above-contract').extracted;

const supplier = aSupplier();
const contractFor = (monthlyAmount: number | null): Contract => aContract({ monthlyAmount });

describe('supplier_unknown', () => {
  it('fires when the IČO is in no address book', () => {
    expect(supplierCheck(AS_AGREED, null)).toMatchObject({
      code: 'supplier_unknown',
      severity: 'blocking',
    });
  });

  it('stays quiet for a supplier we know', () => {
    expect(supplierCheck(AS_AGREED, supplier)).toBeNull();
  });
});

describe('contract_missing', () => {
  it('fires for a known supplier with nothing in force', () => {
    expect(contractCheck(supplier, [])).toMatchObject({
      code: 'contract_missing',
      severity: 'warning',
    });
  });

  it('stays quiet when a contract applies', () => {
    expect(contractCheck(supplier, [contractFor(15_000)])).toBeNull();
  });

  it('says nothing about a supplier that is unknown anyway', () => {
    expect(contractCheck(null, [])).toBeNull();
  });
});

describe('amount_deviates', () => {
  it('fires when the invoice is more than a tenth off the agreed amount', () => {
    expect(amountCheck(ABOVE, [contractFor(15_000)])).toMatchObject({
      code: 'amount_deviates',
      severity: 'warning',
    });
  });

  it('stays quiet for the agreed amount', () => {
    expect(amountCheck(AS_AGREED, [contractFor(15_000)])).toBeNull();
  });

  it('stays quiet within the tenth', () => {
    expect(amountCheck({ ...AS_AGREED, amountTotal: 16_400 }, [contractFor(15_000)])).toBeNull();
  });

  it('has nothing to compare against on a contract with no monthly amount', () => {
    expect(amountCheck(ABOVE, [contractFor(null)])).toBeNull();
  });
});

describe('due_soon', () => {
  it('fires inside the last week before the due date', () => {
    expect(dueSoonCheck(AS_AGREED, new Date('2026-09-28T00:00:00.000Z'))).toMatchObject({
      code: 'due_soon',
      severity: 'info',
    });
  });

  it('stays quiet with a fortnight to go', () => {
    expect(dueSoonCheck(AS_AGREED, new Date('2026-09-10T00:00:00.000Z'))).toBeNull();
  });

  it('stays quiet about a date it cannot read', () => {
    expect(dueSoonCheck({ ...AS_AGREED, dueOn: 'brzy' }, new Date())).toBeNull();
  });
});

describe('vs_missing', () => {
  it('fires when the invoice names no variable symbol', () => {
    expect(variableSymbolCheck({ ...AS_AGREED, variableSymbol: null })).toMatchObject({
      code: 'vs_missing',
      severity: 'info',
    });
  });

  it('stays quiet when it does', () => {
    expect(variableSymbolCheck(AS_AGREED)).toBeNull();
  });
});
