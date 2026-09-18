import { DomainError } from '../../../kernel/src/errors/index';

const SVJ_DIGITS = 2;
const UNIT_DIGITS = 4;
const MAX_SEQUENCE = 99;
const DIGITS = /^\d+$/;

const reject = (message: string, details: Readonly<Record<string, unknown>>): never => {
  throw new DomainError(message, { code: 'variable_symbol_undecidable', details });
};

/**
 * `<pořadí SVJ na 2><číslo jednotky na 4>` — six digits a payer copies off the prescription and a
 * bank transfer carries back. It is stored on the prescription, so a symbol once issued keeps
 * pointing at the same unit even if the inputs it was built from move.
 *
 * A unit numbered `2A` has no reading as a number and would collide with `2`, so it is refused
 * rather than guessed at: money finding the wrong unit is worse than a prescription that fails.
 */
export const variableSymbolFor = (svjSequence: number, unitNumber: string): string => {
  if (!Number.isInteger(svjSequence) || svjSequence < 1 || svjSequence > MAX_SEQUENCE) {
    reject('Pořadí SVJ se nevejde do variabilního symbolu', { svjSequence });
  }
  if (!DIGITS.test(unitNumber) || unitNumber.length > UNIT_DIGITS) {
    reject('Číslo jednotky nejde zapsat do variabilního symbolu', { unitNumber });
  }

  return String(svjSequence).padStart(SVJ_DIGITS, '0') + unitNumber.padStart(UNIT_DIGITS, '0');
};
