import type { Period } from '../domain/period';
import type { PrescriptionPlan } from '../domain/types';

/**
 * The rates the demo runs on (task 013). Fond oprav is per square metre; the advance on services
 * differs by what the unit is, because a garage consumes neither heat nor water the way a flat does.
 */
export const DEMO_PLAN: PrescriptionPlan = {
  items: [
    { code: 'fond_oprav', label: 'Fond oprav', basis: 'per_square_metre', rate: 35 },
    {
      code: 'zalohy_sluzby',
      label: 'Zálohy na služby',
      basis: 'per_unit',
      rate: 1800,
      rateByKind: { apartment: 1800, garage: 600, commercial: 2400 },
    },
    { code: 'sprava', label: 'Správa', basis: 'per_unit', rate: 250 },
  ],
  dueDayOfMonth: 15,
};

export const SEEDED_MONTHS = 12;

/**
 * The twelve months whose due date has already passed on `today` — a year of history, so a balance
 * and a debtor list have something to be about from the first minute. A month still waiting for its
 * due day is left out: nothing could have paid it yet, and a bank statement ending today would
 * never contain that payment, so seeding it would leave every unit in debt on the 1st–14th.
 */
export const dueMonthsAt = (today: Date, count = SEEDED_MONTHS): readonly Period[] => {
  const lastDue = today.getUTCDate() >= DEMO_PLAN.dueDayOfMonth ? 0 : 1;
  return Array.from({ length: count }, (_unused, index) => {
    const month = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - lastDue - (count - 1 - index), 1),
    );
    return { year: month.getUTCFullYear(), month: month.getUTCMonth() + 1 };
  });
};
