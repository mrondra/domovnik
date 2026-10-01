import { z } from 'zod';
import { defineScenarioKind, demoToday, type ScenarioResult } from '../../demo/index';
import { DomainError } from '../../../kernel/src/errors/index';
import { dueMonthsAt } from '../../receivables/index';
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

/**
 * The statement a person would ask the bank for: from the first day of the oldest of the last
 * `months` months whose due day has passed, up to `today`. Seeded prescriptions come from the same
 * rule, so every payment they imply falls inside the range, on any day of the month.
 */
export const statementRange = (months: number, today: Date): { from: string; to: string } => {
  const [oldest] = dueMonthsAt(today, months);
  if (!oldest) throw new DomainError('A statement covers at least one month');
  return {
    from: asDay(new Date(Date.UTC(oldest.year, oldest.month - 1, 1))),
    to: asDay(today),
  };
};

/**
 * Reading a statement, the same call the bank button in the UI makes. What the movements turn out
 * to be about is `payments`' own business; this only decides which account and how far back (task 021).
 */
export const bankSyncScenario = defineScenarioKind({
  kind: 'bank_sync',
  feature: 'payments',
  payload: bankSyncPayloadSchema,
  run: async (ctx, code, asked): Promise<ScenarioResult> => {
    const range = statementRange(Math.min(asked.months, MONTHS), demoToday());

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
