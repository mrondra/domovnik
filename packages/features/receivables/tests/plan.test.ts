import { describe, expect, it } from 'vitest';
import { applyPlan } from '../domain/plan';
import { comparePeriods, dueDateOf, formatPeriod } from '../domain/period';
import { DomainError } from '../../../kernel/src/errors/index';
import type { PrescriptionPlan } from '../domain/types';

const PLAN: PrescriptionPlan = {
  items: [
    { code: 'fond_oprav', label: 'Fond oprav', basis: 'per_square_metre', rate: 25 },
    {
      code: 'zalohy_sluzby',
      label: 'Zálohy na služby',
      basis: 'per_unit',
      rate: 1800,
      rateByKind: { garage: 600 },
    },
  ],
  dueDayOfMonth: 15,
};

const FLAT = { floorArea: 42.5, kind: 'apartment' } as const;

describe('applyPlan', () => {
  it('multiplies a rate per square metre by the floor area', () => {
    expect(applyPlan(PLAN, FLAT).items).toMatchObject([{ amount: 1062.5 }, { amount: 1800 }]);
  });

  it('adds the total from the rounded lines, so the prescription adds up', () => {
    const planned = applyPlan(PLAN, FLAT);

    expect(planned.total).toBe(planned.items.reduce((sum, item) => sum + item.amount, 0));
  });

  it('charges a garage what the plan says a garage pays', () => {
    const planned = applyPlan(PLAN, { floorArea: 16, kind: 'garage' });

    expect(planned.items).toMatchObject([{ amount: 400 }, { amount: 600 }]);
  });

  it('falls back to the flat rate for a kind the plan does not name', () => {
    const planned = applyPlan(PLAN, { floorArea: 118, kind: 'commercial' });

    expect(planned.items.at(-1)?.amount).toBe(1800);
  });
});

describe('the accounting month', () => {
  it('writes a period as a sortable string', () => {
    expect(formatPeriod({ year: 2026, month: 9 })).toBe('2026-09');
  });

  it('orders periods across the turn of the year', () => {
    expect(comparePeriods({ year: 2025, month: 12 }, { year: 2026, month: 1 })).toBeLessThan(0);
  });

  it('places the due date inside the month it belongs to', () => {
    expect(dueDateOf({ year: 2026, month: 9 }, 15)).toBe('2026-09-15');
  });

  it('refuses a due day the month does not have', () => {
    expect(() => dueDateOf({ year: 2026, month: 2 }, 30)).toThrow(DomainError);
  });
});
