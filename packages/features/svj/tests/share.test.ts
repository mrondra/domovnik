import { describe, expect, it } from 'vitest';
import { formatShare, share, shareRatio } from '../domain/share';

describe('the share of the common parts', () => {
  it('keeps the fraction as it was written down', () => {
    expect(share(6543, 123_456)).toEqual({ numerator: 6543, denominator: 123_456 });
  });

  it('rejects a fraction that is not a positive whole ratio', () => {
    expect(() => share(0, 100)).toThrow(/kladný zlomek/);
    expect(() => share(12.5, 100)).toThrow(/kladný zlomek/);
    expect(() => share(1, 0)).toThrow(/kladný zlomek/);
  });

  it('rejects a share larger than the whole house', () => {
    expect(() => share(101, 100)).toThrow(/nesmí přesáhnout celek/);
  });

  it('reads out as the fraction and computes as a ratio', () => {
    expect(formatShare(share(123, 10_000))).toBe('123/10000');
    expect(shareRatio(share(1, 4))).toBe(0.25);
  });
});
