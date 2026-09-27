import { afterEach, describe, expect, it } from 'vitest';
import { clearSeeds, defineSeed } from '../../../kernel/src/seed/index';
import { clearDemoResets, defineDemoReset } from '../domain/definition';
import { demoResetOrder } from '../service/reset';

afterEach(() => {
  clearSeeds();
  clearDemoResets();
});

const reset = (feature: string): void => {
  defineDemoReset({ feature, run: () => Promise.resolve(0) });
};

describe('demoResetOrder', () => {
  it('reverses the order the matching seeds ran in', () => {
    defineSeed({ name: 'invoices', run: () => Promise.resolve() });
    defineSeed({ name: 'payments', dependsOn: ['invoices'], run: () => Promise.resolve() });
    defineSeed({ name: 'accounting-sync', dependsOn: ['payments'], run: () => Promise.resolve() });

    reset('invoices');
    reset('payments');
    reset('accounting-sync');

    expect(demoResetOrder().map((one) => one.feature)).toStrictEqual([
      'accounting-sync',
      'payments',
      'invoices',
    ]);
  });

  it('puts a reset whose feature has no seed at the end', () => {
    defineSeed({ name: 'invoices', run: () => Promise.resolve() });

    reset('invoices');
    reset('documents');

    expect(demoResetOrder().map((one) => one.feature)).toStrictEqual(['invoices', 'documents']);
  });

  it('leaves resets with no seed at all in a stable, reproducible order', () => {
    reset('receivables');
    reset('documents');

    expect(demoResetOrder().map((one) => one.feature)).toStrictEqual(['documents', 'receivables']);
  });
});
