import { describe, expect, it } from 'vitest';
import { SEEDED_MONTHS, dueMonthsAt } from '../seed/plan';

const span = (today: string): readonly (string | undefined)[] => {
  const labels = dueMonthsAt(new Date(today)).map(
    ({ year, month }) => `${String(year)}-${String(month).padStart(2, '0')}`,
  );
  return [labels.at(0), labels.at(-1)];
};

describe('dueMonthsAt', () => {
  it('always returns a year of months', () => {
    expect(dueMonthsAt(new Date('2026-10-01T05:33:00.000Z'))).toHaveLength(SEEDED_MONTHS);
  });

  it('ends with the running month once its due day has come', () => {
    expect(span('2026-10-15T00:00:00.000Z')).toStrictEqual(['2025-11', '2026-10']);
    expect(span('2026-10-31T23:59:00.000Z')).toStrictEqual(['2025-11', '2026-10']);
  });

  it('leaves the running month out before its due day', () => {
    expect(span('2026-10-01T00:00:00.000Z')).toStrictEqual(['2025-10', '2026-09']);
    expect(span('2026-10-01T05:33:00.000Z')).toStrictEqual(['2025-10', '2026-09']);
    expect(span('2026-10-14T23:59:00.000Z')).toStrictEqual(['2025-10', '2026-09']);
  });

  it('treats the last day of the previous month like any other day before the due day', () => {
    expect(span('2026-09-30T19:05:00.000Z')).toStrictEqual(['2025-10', '2026-09']);
  });

  it('crosses the year boundary in both directions', () => {
    expect(span('2027-01-01T00:00:00.000Z')).toStrictEqual(['2026-01', '2026-12']);
    expect(span('2027-01-15T00:00:00.000Z')).toStrictEqual(['2026-02', '2027-01']);
    expect(span('2026-12-31T12:00:00.000Z')).toStrictEqual(['2026-01', '2026-12']);
  });
});
