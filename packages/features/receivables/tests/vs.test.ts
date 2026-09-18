import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../kernel/src/errors/index';
import { variableSymbolFor } from '../domain/vs';

describe('variableSymbolFor', () => {
  it('pads the SVJ sequence to two digits and the unit number to four', () => {
    expect(variableSymbolFor(1, '7')).toBe('010007');
    expect(variableSymbolFor(12, '345')).toBe('120345');
  });

  it('keeps two units of the same SVJ apart', () => {
    expect(variableSymbolFor(3, '1')).not.toBe(variableSymbolFor(3, '10'));
  });

  it('keeps the same unit number of two SVJ apart', () => {
    expect(variableSymbolFor(1, '5')).not.toBe(variableSymbolFor(2, '5'));
  });

  it('refuses a unit number that is not a number', () => {
    expect(() => variableSymbolFor(1, '2A')).toThrow(DomainError);
  });

  it('refuses a unit number that does not fit into four digits', () => {
    expect(() => variableSymbolFor(1, '12345')).toThrow(DomainError);
  });

  it('refuses a sequence that does not fit into two digits', () => {
    expect(() => variableSymbolFor(100, '1')).toThrow(DomainError);
    expect(() => variableSymbolFor(0, '1')).toThrow(DomainError);
  });
});
