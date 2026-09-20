import { DomainError } from '../../../../kernel/src/errors/index';
import { scenario, type InvoiceScenario } from './invoice-text.fixture';

export const CLEANING_ICO = '27000111';

const cleaning = { supplierName: 'Uklid Praha s.r.o.', ico: CLEANING_ICO } as const;

const MONTHLY = { total: 15_000, vat: 2603.31, itemAmount: 15_000 } as const;

/**
 * The ways an invoice can go through the pipeline, one scenario each. Every one has its own invoice
 * number: the number is unique per supplier across the whole management company, so two houses of
 * the same tenant cannot be sent the same one (task 014).
 */
export const SCENARIOS: readonly InvoiceScenario[] = [
  scenario('as-agreed', {
    ...cleaning,
    ...MONTHLY,
    number: '2026-0101',
    item: 'Uklid spolecnych prostor 09/2026',
  }),
  scenario('above-contract', {
    ...cleaning,
    number: '2026-0102',
    total: 19_500,
    vat: 3384.3,
    item: 'Uklid spolecnych prostor 09/2026 vcetne mimoradneho uklidu',
    itemAmount: 19_500,
  }),
  scenario('unknown-supplier', {
    supplierName: 'Zahradnictvi Novak s.r.o.',
    ico: '29888777',
    number: '2026-0500',
    total: 4200,
    vat: 729.75,
    item: 'Serez zivych plotu',
    itemAmount: 4200,
  }),
  scenario('bare-svj', {
    ...cleaning,
    ...MONTHLY,
    number: '2026-0201',
    item: 'Uklid spolecnych prostor 09/2026 - druhy dum',
  }),
  scenario('delivered-twice', {
    ...cleaning,
    ...MONTHLY,
    number: '2026-0202',
    item: 'Uklid spolecnych prostor 10/2026 - druhy dum',
  }),
  scenario('repeated-number', {
    ...cleaning,
    ...MONTHLY,
    number: '2026-0101',
    item: 'Uklid spolecnych prostor 09/2026 - opis',
  }),
];

export const scenarioNamed = (name: string): InvoiceScenario => {
  const found = SCENARIOS.find((one) => one.name === name);
  if (found === undefined) {
    throw new DomainError(`Neznámý scénář ${name}`, {
      code: 'scenario_unknown',
      details: { name },
    });
  }
  return found;
};
