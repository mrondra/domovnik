import { describe, expect, it } from 'vitest';
import { typoDistanceWithin } from '../matching/distance';

describe('how far apart two variable symbols are', () => {
  it('counts a swapped pair of digits as the one slip it is', () => {
    expect(typoDistanceWithin('010012', '010021', 1)).toBe(1);
  });

  it('still keeps a different symbol out', () => {
    expect(typoDistanceWithin('010012', '010031', 1)).toBeNull();
  });

  it('sees a dropped digit as one', () => {
    expect(typoDistanceWithin('010012', '01001', 1)).toBe(1);
  });

  it('sees a single wrong digit as one', () => {
    expect(typoDistanceWithin('010012', '010013', 1)).toBe(1);
  });

  it('answers zero for the same symbol', () => {
    expect(typoDistanceWithin('010012', '010012', 1)).toBe(0);
  });

  it('gives up early on something far away rather than walking it', () => {
    expect(typoDistanceWithin('010012', '999999', 1)).toBeNull();
  });
});
