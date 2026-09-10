import { describe } from 'vitest';

export interface AdapterContract<T> {
  readonly name: string;
  readonly mock: () => T;
  readonly real?: (() => T) | undefined;
  /** When this variable is `true`, the same suite also runs against the real implementation. */
  readonly realEnabledBy: string;
}

export const describeAdapterContract = <T>(
  contract: AdapterContract<T>,
  suite: (adapter: () => T) => void,
): void => {
  describe(`${contract.name} (mock)`, () => {
    suite(contract.mock);
  });

  const real = contract.real;
  const enabled = real !== undefined && process.env[contract.realEnabledBy] === 'true';
  describe.skipIf(!enabled)(`${contract.name} (real)`, () => {
    suite(real ?? contract.mock);
  });
};
