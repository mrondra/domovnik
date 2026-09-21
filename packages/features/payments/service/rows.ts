import type { InferSelectModel } from 'drizzle-orm';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { bankAccountIdSchema, bankTransactionIdSchema } from '../domain/ids';
import type { BankAccount, BankTransaction } from '../domain/types';
import { bankAccount, bankTransaction } from '../schema';

/** Drizzle returns `numeric` as a string, so the column decides the precision, not a float. */
export const asMoney = (value: number): string => value.toFixed(2);

const optional = (value: string | null): string | undefined => value ?? undefined;

export const toBankAccount = (row: InferSelectModel<typeof bankAccount>): BankAccount => ({
  id: bankAccountIdSchema.parse(row.id),
  svjId: svjIdSchema.parse(row.svjId),
  iban: row.iban,
  number: row.number,
  bankCode: row.bankCode,
  label: row.label,
  isPrimary: row.isPrimary,
});

export const toTransaction = (row: InferSelectModel<typeof bankTransaction>): BankTransaction => ({
  id: bankTransactionIdSchema.parse(row.id),
  svjId: svjIdSchema.parse(row.svjId),
  bankAccountId: bankAccountIdSchema.parse(row.bankAccountId),
  externalId: row.externalId,
  bookedOn: row.bookedOn,
  amount: Number(row.amount),
  counterpartyAccount: optional(row.counterpartyAccount),
  counterpartyName: optional(row.counterpartyName),
  variableSymbol: optional(row.variableSymbol),
  specificSymbol: optional(row.specificSymbol),
  message: optional(row.message),
  matchStatus: row.matchStatus,
});
