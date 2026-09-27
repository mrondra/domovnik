/**
 * A day without a time zone, written the way Postgres `date` stores it: `2026-09-15`. A contract's
 * `validFrom`/`validTo` is a day people read off a paper contract, not an instant (invoices task 016).
 */
export type IsoDay = string;

const DAY_LENGTH = 10;

export const asDay = (value: Date): IsoDay => value.toISOString().slice(0, DAY_LENGTH);
