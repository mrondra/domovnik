import { describe, expect, it } from 'vitest';
import { describeAdapterContract } from './contract';

interface Clock {
  now(): number;
}

const seen: string[] = [];

describeAdapterContract<Clock>(
  { name: 'ClockAdapter', mock: () => ({ now: () => 0 }), realEnabledBy: 'RUN_REAL_CLOCK' },
  (adapter) => {
    it('returns a timestamp', () => {
      seen.push('ran');
      expect(adapter().now()).toBe(0);
    });
  },
);

describe('describeAdapterContract', () => {
  it('runs the suite against the mock and skips the real implementation', () => {
    expect(seen).toEqual(['ran']);
  });
});
