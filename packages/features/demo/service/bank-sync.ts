import type { RequestContext } from '../../../kernel/src/context/index';
import { bankAccountIdSchema, syncBankAccount } from '../../payments/index';
import { bankSyncPayloadSchema, type ScenarioResult } from '../domain/types';

const MONTHS = 12;
const DAY_LENGTH = 10;

const asDay = (value: Date): string => value.toISOString().slice(0, DAY_LENGTH);

/** The last `months` whole months up to today — the stretch a person would ask the bank for. */
const rangeOf = (months: number, today = new Date()): { from: string; to: string } => ({
  from: asDay(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (months - 1), 1))),
  to: asDay(today),
});

/**
 * Reading a statement, the same call the bank button in the UI makes. What the movements turn out
 * to be about is `payments`' business; this only decides which account and how far back (task 021).
 */
export const runBankSync = async (
  ctx: RequestContext,
  code: string,
  payload: unknown,
): Promise<ScenarioResult> => {
  const asked = bankSyncPayloadSchema.parse(payload);
  const range = rangeOf(Math.min(asked.months, MONTHS));

  const result = await syncBankAccount(ctx, {
    bankAccountId: bankAccountIdSchema.parse(asked.bankAccountId),
    ...range,
  });

  return {
    code,
    outcome: 'imported',
    message:
      `Načteno ${String(result.count)} pohybů, nových ${String(result.newCount)}, ` +
      `spárováno ${String(result.matchedCount)}, k posouzení ${String(result.unmatched.length)}.`,
    invoiceId: null,
  };
};
