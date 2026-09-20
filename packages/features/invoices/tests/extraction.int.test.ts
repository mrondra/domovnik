import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { codesOfSeverity } from '../domain/checks';
import type { Invoice } from '../domain/types';
import {
  processScenario,
  seedCleaningSupplier,
  seedContract,
  seedTidySvj,
  useRecordedLlm,
} from './extraction.fixture';
import { someSvj, startInvoicesWorld, withTestTenant, type InvoicesWorld } from './world.fixture';

let world: InvoicesWorld;
let ctx: RequestContext;
let tidy: SvjId;
/** A contract, but nobody planned the budget line it books against. */
let unplanned: SvjId;
/** Neither a contract nor a budget: the supplier invoices it out of the blue. */
let bare: SvjId;
const processed = new Map<string, Invoice>();

const of = (scenario: string): Invoice => {
  const found = processed.get(scenario);
  if (found === undefined) throw new TypeError(scenario);
  return found;
};

beforeAll(async () => {
  world = await startInvoicesWorld();
  useRecordedLlm();
  ctx = (await withTestTenant()).ctx;
  tidy = someSvj();
  unplanned = someSvj();
  bare = someSvj();

  const supplierId = await seedCleaningSupplier(ctx);
  await seedTidySvj(ctx, tidy, supplierId);
  await seedContract(ctx, unplanned, supplierId);

  for (const [scenario, svjId] of [
    ['as-agreed', tidy],
    ['above-contract', tidy],
    ['bare-svj', bare],
    ['delivered-twice', unplanned],
  ] as const) {
    processed.set(scenario, await processScenario(ctx, svjId, scenario));
  }
}, 300_000);

afterAll(async () => {
  await world.stop();
});

describe('an invoice that checks itself', () => {
  it('reads it, matches it and leaves it extracted with nothing to say', () => {
    const invoice = of('as-agreed');

    expect(invoice.status).toBe('extracted');
    expect(codesOfSeverity(invoice.checks, 'warning')).toStrictEqual([]);
    expect(invoice).toMatchObject({
      externalNumber: '2026-0101',
      variableSymbol: '20260101',
      amountTotal: 15_000,
      amountVat: 2603.31,
      issuedOn: '2026-09-01',
      dueOn: '2026-09-30',
      currency: 'CZK',
      budgetCategory: 'uklid',
    });
    expect(invoice.supplierId).not.toBeNull();
    expect(invoice.contractId).not.toBeNull();
  });

  it('keeps what the model read, so the decision can be explained later', () => {
    expect(of('above-contract').extraction).toMatchObject({
      supplierIco: '27000111',
      lines: [{ amount: 19_500 }],
    });
  });
});

describe('an invoice with something worth saying about it', () => {
  it('extracts it and warns that it is above the contract', () => {
    const invoice = of('above-contract');

    expect(invoice.status).toBe('extracted');
    expect(codesOfSeverity(invoice.checks, 'warning')).toContain('amount_deviates');
  });

  it('warns about a supplier invoicing an SVJ it has no contract with', () => {
    expect(of('bare-svj').status).toBe('extracted');
    expect(codesOfSeverity(of('bare-svj').checks, 'warning')).toStrictEqual(['contract_missing']);
  });

  // Without a contract there is no category, and without a category there is no line to check
  // against — so this needs the SVJ that has the one and not the other.
  it('warns when the budget line the invoice books against has nothing left', () => {
    expect(of('delivered-twice').status).toBe('extracted');
    expect(codesOfSeverity(of('delivered-twice').checks, 'warning')).toStrictEqual(['budget_exceeded']);
  });
});
