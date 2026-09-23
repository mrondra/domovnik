import { describe, expect, it } from 'vitest';
import { dailyTick, monthlyTick } from './ticks';

describe('dailyTick', () => {
  it('stamps the tick.daily name onto the envelope', () => {
    const envelope = dailyTick.create({ at: '2024-01-01T00:00:00Z' });
    expect(envelope.name).toBe('tick.daily');
  });

  it('accepts an ISO datetime payload', () => {
    const envelope = dailyTick.create({ at: '2024-01-01T00:00:00Z' });
    expect(envelope.payload.at).toBe('2024-01-01T00:00:00Z');
  });

  it('rejects a non-ISO-datetime payload', () => {
    expect(() => dailyTick.create({ at: '2024-01-01' })).toThrow();
  });

  it('rejects a missing payload field', () => {
    expect(() => dailyTick.create({} as never)).toThrow();
  });
});

describe('monthlyTick', () => {
  it('stamps the tick.monthly name onto the envelope', () => {
    const envelope = monthlyTick.create({ at: '2024-01-01T00:00:00Z' });
    expect(envelope.name).toBe('tick.monthly');
  });

  it('accepts an ISO datetime payload', () => {
    const envelope = monthlyTick.create({ at: '2024-01-01T00:00:00Z' });
    expect(envelope.payload.at).toBe('2024-01-01T00:00:00Z');
  });

  it('rejects a non-ISO-datetime payload', () => {
    expect(() => monthlyTick.create({ at: 'not-a-date' })).toThrow();
  });
});
