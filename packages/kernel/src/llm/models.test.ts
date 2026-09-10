import { describe, expect, it } from 'vitest';
import { MODEL_IDS, resolveModel } from './models';

describe('model aliases', () => {
  it('routes decisions to Sonnet and extraction to Haiku', () => {
    expect(resolveModel('sonnet')).toBe(MODEL_IDS.sonnet);
    expect(resolveModel('haiku')).toBe('claude-haiku-4-5');
  });
});
