import type { Period } from '../domain/period';
const CZK = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' });
const DAY = new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium' });
const MONTH = new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' });

export const formatAmount = (value: number): string => CZK.format(value);

export const formatDay = (value: string): string => DAY.format(new Date(`${value}T00:00:00.000Z`));

export const formatMonth = (period: Period): string =>
  MONTH.format(new Date(Date.UTC(period.year, period.month - 1, 1)));

/** A debt is a negative balance; people read it as a positive number they owe. */
export const formatDebt = (balance: number): string => formatAmount(Math.abs(balance));
