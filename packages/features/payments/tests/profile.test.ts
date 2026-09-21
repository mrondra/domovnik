import { describe, expect, it } from 'vitest';
import { mistype, profileFor, PROFILES } from '../adapters/synthetic/profile';
import { periodsBetween, within } from '../adapters/synthetic/periods';

describe('the profile of a house', () => {
  it('gives the first house nothing to go wrong with', () => {
    const first = profileFor(1);

    expect(first).toMatchObject({ silent: [], mistyped: [], joint: null, short: null });
  });

  it('puts the residual in the second house', () => {
    const second = profileFor(2);

    expect(second.silent).toHaveLength(3);
    expect(second.mistyped).toHaveLength(2);
    expect(second.joint).not.toBeNull();
  });

  it('leaves somebody two hundred crowns short in the third', () => {
    expect(profileFor(3).short).toStrictEqual({ at: 0, by: 200 });
  });

  it('falls back to paying properly for a house nobody wrote a profile for', () => {
    expect(profileFor(PROFILES.length + 1)).toMatchObject({ silent: [] });
  });
});

describe('a mistyped variable symbol', () => {
  it('swaps the last two digits, the way a person does', () => {
    expect(mistype('010012')).toBe('010021');
  });

  it('leaves something too short to swap alone', () => {
    expect(mistype('7')).toBe('7');
  });

  it('does not hand the money to whoever really owns the swapped symbol', () => {
    const taken = new Set(['010021']);

    expect(mistype('010012', taken)).toBe('01001');
  });
});

describe('the months a range of days covers', () => {
  it('counts both ends in, oldest first', () => {
    const months = periodsBetween('2026-07-14', '2026-09-02');

    expect(months).toStrictEqual([
      { year: 2026, month: 7 },
      { year: 2026, month: 8 },
      { year: 2026, month: 9 },
    ]);
  });

  it('crosses the turn of the year', () => {
    expect(periodsBetween('2025-12-01', '2026-01-31')).toHaveLength(2);
  });

  it('answers nothing for a range that runs backwards', () => {
    expect(periodsBetween('2026-09-01', '2026-08-01')).toStrictEqual([]);
  });

  it('knows whether a day is in the range, and that a missing day never is', () => {
    expect([
      within('2026-09-15', '2026-09-01', '2026-09-30'),
      within('2026-10-01', '2026-09-01', '2026-09-30'),
      within(null, '2026-09-01', '2026-09-30'),
    ]).toStrictEqual([true, false, false]);
  });
});
