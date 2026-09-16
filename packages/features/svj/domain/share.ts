import { DomainError } from '../../../kernel/src/errors/index';

/** The share of the common parts, written as the fraction the deed carries (zadání kap. 4). */
export interface Share {
  readonly numerator: number;
  readonly denominator: number;
}

const isPositiveInteger = (value: number): boolean => Number.isInteger(value) && value > 0;

export const share = (numerator: number, denominator: number): Share => {
  if (!isPositiveInteger(numerator) || !isPositiveInteger(denominator)) {
    throw new DomainError('Podíl na společných částech musí být kladný zlomek', {
      code: 'share_not_a_fraction',
      details: { numerator, denominator },
    });
  }
  if (numerator > denominator) {
    throw new DomainError('Podíl na společných částech nesmí přesáhnout celek', {
      code: 'share_above_whole',
      details: { numerator, denominator },
    });
  }
  return { numerator, denominator };
};

export const shareRatio = (value: Share): number => value.numerator / value.denominator;

/** How the fraction is written down and read out: `123/10000`. */
export const formatShare = (value: Share): string =>
  `${String(value.numerator)}/${String(value.denominator)}`;
