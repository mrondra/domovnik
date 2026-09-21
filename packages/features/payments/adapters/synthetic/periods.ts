import type { Period } from '../../../receivables/index';
import type { IsoDay } from '../../domain/types';

const MONTHS = 12;
const DIGITS = 2;

const periodOf = (day: IsoDay): Period => ({
  year: Number(day.slice(0, 4)),
  month: Number(day.slice(5, 7)),
});

const asIndex = (period: Period): number => period.year * MONTHS + (period.month - 1);

export const formatPeriod = (period: Period): string =>
  `${String(period.year)}-${String(period.month).padStart(DIGITS, '0')}`;

/** Every accounting month the range touches, oldest first. A statement is read that way too. */
export const periodsBetween = (from: IsoDay, to: IsoDay): readonly Period[] => {
  const first = asIndex(periodOf(from));
  const last = asIndex(periodOf(to));
  if (Number.isNaN(first) || Number.isNaN(last) || last < first) return [];

  return Array.from({ length: last - first + 1 }, (_unused, offset) => {
    const index = first + offset;
    return { year: Math.floor(index / MONTHS), month: (index % MONTHS) + 1 };
  });
};

export const within = (day: IsoDay | null, from: IsoDay, to: IsoDay): boolean =>
  day !== null && day >= from && day <= to;
