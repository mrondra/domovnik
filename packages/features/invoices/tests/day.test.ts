import { describe, expect, it } from 'vitest';
import { addWorkingDays } from '../domain/day';

describe('addWorkingDays', () => {
  it('counts Friday + 2 as Tuesday', () => {
    expect(addWorkingDays('2026-09-04', 2)).toBe('2026-09-08');
  });

  it('counts Monday + 2 as Wednesday', () => {
    expect(addWorkingDays('2026-09-07', 2)).toBe('2026-09-09');
  });

  it('starts counting from the next working day when the start is a Saturday', () => {
    expect(addWorkingDays('2026-09-05', 1)).toBe('2026-09-07');
  });

  it('returns the day itself for zero', () => {
    expect(addWorkingDays('2026-09-05', 0)).toBe('2026-09-05');
  });
});
