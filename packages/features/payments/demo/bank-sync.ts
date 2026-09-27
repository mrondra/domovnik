import { z } from 'zod';
import { defineScenarioKind, type ScenarioResult } from '../../demo/index';
import { bankAccountIdSchema } from '../domain/ids';
import { syncBankAccount } from '../service/index';

/** Reading a statement: which account, and how far back. The movements are derived, not stored. */
const bankSyncPayloadSchema = z.object({
  bankAccountId: z.uuid(),
  svjId: z.uuid(),
  months: z.int().positive(),
});

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
 * to be about is `payments`' own business; this only decides which account and how far back (task 021).
 */
export const bankSyncScenario = defineScenarioKind({
  kind: 'bank_sync',
  feature: 'payments',
  payload: bankSyncPayloadSchema,
  run: async (ctx, code, asked): Promise<ScenarioResult> => {
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
      link: null,
    };
  },
});
