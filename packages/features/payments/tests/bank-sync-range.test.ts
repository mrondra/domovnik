import { describe, expect, it } from 'vitest';
import { statementRange } from '../demo/bank-sync';

const MONTHS = 12;

describe('statementRange', () => {
  it('ends the day it is read and starts at the oldest due month', () => {
    expect(statementRange(MONTHS, new Date('2026-10-01T05:33:00.000Z'))).toEqual({
      from: '2025-10-01',
      to: '2026-10-01',
    });
  });

  it('keeps the previous month as the newest one until the 15th', () => {
    expect(statementRange(MONTHS, new Date('2026-10-14T23:59:00.000Z')).from).toBe('2025-10-01');
    expect(statementRange(MONTHS, new Date('2026-09-30T19:05:00.000Z')).from).toBe('2025-10-01');
  });

  it('moves a month on from the 15th', () => {
    expect(statementRange(MONTHS, new Date('2026-10-15T00:00:00.000Z'))).toEqual({
      from: '2025-11-01',
      to: '2026-10-15',
    });
  });

  it('crosses the year boundary', () => {
    expect(statementRange(MONTHS, new Date('2027-01-01T00:00:00.000Z'))).toEqual({
      from: '2026-01-01',
      to: '2027-01-01',
    });
    expect(statementRange(MONTHS, new Date('2026-12-31T12:00:00.000Z')).from).toBe('2026-01-01');
  });

  it('reaches back only as many months as asked', () => {
    expect(statementRange(3, new Date('2026-10-15T12:00:00.000Z')).from).toBe('2026-08-01');
  });
});
