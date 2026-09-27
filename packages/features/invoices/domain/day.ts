/**
 * A day without a time zone, written the way Postgres `date` stores it: `2026-09-15`. An issue date
 * and a due date are days people read off a paper invoice, not instants, and an instant would carry
 * a time zone into everything that touches it — and into the OpenAPI document, which has no date.
 */
export type IsoDay = string;

export const firstDayOf = (year: number): IsoDay => `${String(year)}-01-01`;

export const lastDayOf = (year: number): IsoDay => `${String(year)}-12-31`;
