import { describe, expect, it } from 'vitest';
import { orderSeedModules } from './index';
import type { SeedModule } from './index';

const module = (name: string, dependsOn: readonly string[] = []): SeedModule => ({
  name,
  dependsOn,
  run: () => Promise.resolve(),
});

const names = (modules: readonly SeedModule[]): readonly string[] => modules.map((entry) => entry.name);

describe('orderSeedModules', () => {
  it('puts a dependency before the module that declares it', () => {
    expect(names(orderSeedModules([module('invoices', ['svj']), module('svj')]))).toStrictEqual([
      'svj',
      'invoices',
    ]);
  });

  it('orders independent modules by name, so the seed is reproducible', () => {
    expect(names(orderSeedModules([module('payments'), module('invoices')]))).toStrictEqual([
      'invoices',
      'payments',
    ]);
  });

  it('rejects a cycle', () => {
    expect(() => orderSeedModules([module('a', ['b']), module('b', ['a'])])).toThrow(/Cyklická/);
  });

  it('rejects a dependency on a feature that has no seed', () => {
    expect(() => orderSeedModules([module('invoices', ['svj'])])).toThrow(/neznám|nemá/);
  });
});
