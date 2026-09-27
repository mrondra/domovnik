import { DomainError } from '../../../../kernel/src/errors/index';

const BODY_LENGTH = 7;
const MODULUS = 11;

/**
 * The check digit of a Czech IČO: the first seven digits weighted 8…2, taken modulo eleven. Demo
 * data is invented, but an invented IČO that fails the check is the sort of thing a sharp-eyed
 * accountant spots in the middle of a demonstration (zadání kap. 10).
 */
export const withChecksum = (body: string): string => {
  if (body.length !== BODY_LENGTH || !/^\d+$/u.test(body)) {
    throw new DomainError('Základ IČO musí být sedm číslic', {
      code: 'ico_body_invalid',
      details: { body },
    });
  }

  const sum = Array.from(body, (digit, index) => Number(digit) * (8 - index)).reduce(
    (total, part) => total + part,
    0,
  );
  const rest = sum % MODULUS;
  const check = rest === 0 ? 1 : rest === 1 ? 0 : MODULUS - rest;

  return `${body}${String(check)}`;
};
