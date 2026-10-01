import { describe, expect, it } from 'vitest';
import { demoScenarios } from '../seed/data/invoices';

const on = (day: string): Date => new Date(`${day}T05:33:00.000Z`);

const scenario = (today: Date, code: string) => {
  const found = demoScenarios(today).find((one) => one.code === code);
  if (found === undefined) throw new RangeError(code);
  return found;
};

describe('the demo invoices on the day the recorded extraction was made', () => {
  // The recorded LLM answers are keyed by a hash of the PDF text, so these must not drift.
  const today = on('2026-09-01');

  it('print the dates, number and period the fixtures were recorded against', () => {
    const routine = scenario(today, 'invoice-routine');

    expect(routine.subject).toBe('Faktura za úklid 09/2026');
    expect(routine.invoice).toMatchObject({
      number: '2026-0901',
      variableSymbol: '20260901',
      issuedOn: '2026-09-01',
      dueOn: '2026-09-30',
      lines: [{ description: 'Uklid spolecnych prostor 09/2026', amount: 8500 }],
    });
  });

  it('keep the numbers of the other invoices', () => {
    const numbers = demoScenarios(today).map((one) => [one.code, one.invoice.number]);

    expect(numbers).toStrictEqual([
      ['invoice-routine', '2026-0901'],
      ['invoice-over-budget', '2026-0455'],
      ['invoice-above-contract', '2026-1120'],
      ['invoice-unknown-supplier', '2026-0330'],
      ['invoice-duplicate', '2026-1120'],
    ]);
  });
});

describe('the demo invoices on the days around a month and a year end', () => {
  it.each(['2026-09-30', '2026-10-01', '2026-10-14', '2026-10-15', '2026-12-31', '2027-01-01'])(
    'are still unpaid on %s, because they fall due after the day the statement ends',
    (day) => {
      for (const one of demoScenarios(on(day))) {
        expect(one.invoice.issuedOn).toBe(day);
        expect(one.invoice.dueOn > day).toBe(true);
      }
    },
  );

  it.each([
    ['2026-12-31', '2026'],
    ['2027-01-01', '2027'],
  ])('take the year of the number and the variable symbol from the day, %s', (day, year) => {
    const routine = scenario(on(day), 'invoice-routine');

    expect(routine.invoice.number.startsWith(`${year}-`)).toBe(true);
    expect(routine.invoice.variableSymbol.startsWith(year)).toBe(true);
  });

  it('name the month of the day in the line and in the subject', () => {
    const routine = scenario(on('2027-01-01'), 'invoice-routine');

    expect(routine.subject).toBe('Faktura za úklid 01/2027');
    expect(routine.invoice.lines[0]?.description).toBe('Uklid spolecnych prostor 01/2027');
  });

  it('do not depend on the time of day', () => {
    const late = new Date('2026-09-30T23:59:59.000Z');

    expect(scenario(late, 'invoice-routine').invoice).toMatchObject({
      issuedOn: '2026-09-30',
      dueOn: '2026-10-29',
    });
  });
});
