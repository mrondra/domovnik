import { z } from 'zod';
import { DomainError } from '../../../kernel/src/errors/index';

/** An accounting month. Prescriptions are monthly, so every date in this feature is one of these. */
export interface Period {
  readonly year: number;
  readonly month: number;
}

const FIRST_YEAR = 2000;
const LAST_YEAR = 2100;
const MONTHS = 12;
const MONTH_DIGITS = 2;

export const periodSchema = z.object({
  year: z.int().min(FIRST_YEAR).max(LAST_YEAR),
  month: z.int().min(1).max(MONTHS),
});

/** Sortable and readable: `2026-09`. It is what the audit row and the event carry. */
export const formatPeriod = (period: Period): string =>
  `${String(period.year)}-${String(period.month).padStart(MONTH_DIGITS, '0')}`;

export const comparePeriods = (left: Period, right: Period): number =>
  left.year === right.year ? left.month - right.month : left.year - right.year;

/**
 * The day of the month prescriptions fall due. A day the month does not have would silently roll
 * over into the next one, which is a due date nobody wrote down.
 */
export const dueDateOf = (period: Period, dayOfMonth: number): Date => {
  const due = new Date(Date.UTC(period.year, period.month - 1, dayOfMonth));
  if (due.getUTCMonth() !== period.month - 1) {
    throw new DomainError('Splatnost připadá mimo měsíc předpisu', {
      code: 'due_day_outside_period',
      details: { period: formatPeriod(period), dayOfMonth },
    });
  }
  return due;
};
