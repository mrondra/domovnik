import { z } from 'zod';
import type { BankStatementLine, FetchStatementsInput } from '../../../domain/types';

const storedLine = z.object({
  externalId: z.string(),
  bookedOn: z.string(),
  amount: z.number(),
  variableSymbol: z.string().nullable(),
  counterpartyAccount: z.string().nullable(),
  counterpartyName: z.string().nullable(),
  message: z.string().nullable(),
});

/** Stored as plain JSON, so what is absent is `null` rather than a key that is not there. */
export const asStoredLine = (line: BankStatementLine): Readonly<Record<string, unknown>> => ({
  externalId: line.externalId,
  bookedOn: line.bookedOn,
  amount: line.amount,
  variableSymbol: line.variableSymbol ?? null,
  counterpartyAccount: line.counterpartyAccount ?? null,
  counterpartyName: line.counterpartyName ?? null,
  message: line.message ?? null,
});

const asLine = (state: unknown): BankStatementLine | null => {
  const parsed = storedLine.safeParse(state);
  if (!parsed.success) return null;

  const { variableSymbol, counterpartyAccount, counterpartyName, message, ...rest } = parsed.data;
  return {
    ...rest,
    variableSymbol: variableSymbol ?? undefined,
    counterpartyAccount: counterpartyAccount ?? undefined,
    counterpartyName: counterpartyName ?? undefined,
    message: message ?? undefined,
  };
};

/** What the accounting holds for the period asked about, in the order a statement is read in. */
export const linesWithin = (
  states: readonly unknown[],
  input: FetchStatementsInput,
): readonly BankStatementLine[] =>
  states
    .map(asLine)
    .filter((line): line is BankStatementLine => line !== null)
    .filter((line) => line.bookedOn >= input.from && line.bookedOn <= input.to)
    .sort((left, right) => left.bookedOn.localeCompare(right.bookedOn));
