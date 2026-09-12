import { describe, expect, it } from 'vitest';
import { clearSeeds, defineSeed, registeredSeeds } from './registry';
import type { SeedModule } from './types';

const module = (name: string): SeedModule => ({ name, run: () => Promise.resolve() });

describe('seed registry', () => {
  it('registers a seed as a side effect of defining it', () => {
    clearSeeds();
    defineSeed(module('svj'));
    expect(registeredSeeds().map((seed) => seed.name)).toEqual(['svj']);
  });

  it('keeps one entry per name, so a reloaded module does not seed twice', () => {
    clearSeeds();
    defineSeed(module('svj'));
    defineSeed(module('svj'));
    expect(registeredSeeds()).toHaveLength(1);
  });

  it('returns the module it was given, so a feature can export the call', () => {
    clearSeeds();
    const declared = module('svj');
    expect(defineSeed(declared)).toBe(declared);
  });
});
