/**
 * A day without a time zone, written the way Postgres `date` stores it: `2026-09-15`. An issue date
 * and a due date are days people read off a paper invoice, not instants, and an instant would carry
 * a time zone into everything that touches it — and into the OpenAPI document, which has no date.
 */
export type IsoDay = string;

export const firstDayOf = (year: number): IsoDay => `${String(year)}-01-01`;

export const lastDayOf = (year: number): IsoDay => `${String(year)}-12-31`;

const MS_PER_DAY = 86_400_000;

/** Monday to Friday only: the repo has no calendar of holidays, so a holiday counts as a working day. */
export const addWorkingDays = (day: IsoDay, count: number): IsoDay => {
  const date = new Date(`${day}T00:00:00.000Z`);
  let remaining = count;
  while (remaining > 0) {
    date.setTime(date.getTime() + MS_PER_DAY);
    const weekday = date.getUTCDay();
    if (weekday !== 0 && weekday !== 6) remaining -= 1;
  }
  return date.toISOString().slice(0, 10);
};
