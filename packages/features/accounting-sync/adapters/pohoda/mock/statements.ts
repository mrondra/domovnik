import type { BankStatementLine, FetchStatementsInput } from '../../../domain/types';
import { refFor } from './refs';

const DAY = 24 * 60 * 60 * 1000;
const LINES = 3;
const BASE_AMOUNT = 3300;

/**
 * A statement the demo's Pohoda would hand over: derived from the range asked for, so asking twice
 * gives the same lines and importing them twice adds nothing. The real statements the demo runs on
 * come from the bank adapter (task 021); this exists so the contract test has both sides.
 */
export const statementsFor = (input: FetchStatementsInput): readonly BankStatementLine[] => {
  const from = Date.parse(`${input.from}T00:00:00.000Z`);
  if (Number.isNaN(from)) return [];

  return Array.from({ length: LINES }, (_unused, index) => {
    const bookedOn = new Date(from + index * DAY).toISOString().slice(0, 10);
    return {
      externalId: refFor('stk', `${input.accountIco}:${bookedOn}:${String(index)}`),
      bookedOn,
      amount: BASE_AMOUNT + index,
      variableSymbol: String(100_000 + index),
      counterpartyName: `Plátce ${String(index + 1)}`,
      message: `Výpis ${input.from} – ${input.to}`,
    };
  }).filter((line) => line.bookedOn <= input.to);
};
