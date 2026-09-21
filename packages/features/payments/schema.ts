import { boolean, date, index, numeric, pgEnum, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { svjTable } from '../../kernel/src/db/index';

/** Where a movement stands. `proposed` is an agent's suggestion waiting on a person (task 022). */
export const matchStatusEnum = pgEnum('match_status', ['unmatched', 'matched', 'proposed', 'ignored']);

export const matchTargetEnum = pgEnum('match_target', ['prescription', 'invoice']);

/** How the match was arrived at; `vs_amount` is the only one that needs nobody's judgement. */
export const matchMethodEnum = pgEnum('match_method', ['vs_amount', 'vs_only', 'agent', 'manual']);

const MONEY = { precision: 12, scale: 2 } as const;

export const bankAccount = svjTable(
  'bank_account',
  {
    iban: text('iban'),
    number: text('number').notNull(),
    bankCode: text('bank_code').notNull(),
    label: text('label').notNull(),
    isPrimary: boolean('is_primary').notNull().default(false),
  },
  (table) => [uniqueIndex('bank_account_number_unique').on(table.tenantId, table.number, table.bankCode)],
);

/**
 * One movement on a statement, as the bank reported it. `externalId` is the bank's own id for it,
 * and it is what makes importing the same statement twice add nothing (task 020).
 */
export const bankTransaction = svjTable(
  'bank_transaction',
  {
    bankAccountId: uuid('bank_account_id').notNull(),
    externalId: text('external_id').notNull(),
    bookedOn: date('booked_on').notNull(),
    /** Positive is money in, negative money out — the sign the statement itself uses. */
    amount: numeric('amount', MONEY).notNull(),
    counterpartyAccount: text('counterparty_account'),
    counterpartyName: text('counterparty_name'),
    variableSymbol: text('variable_symbol'),
    specificSymbol: text('specific_symbol'),
    message: text('message'),
    matchStatus: matchStatusEnum('match_status').notNull(),
  },
  (table) => [
    uniqueIndex('bank_transaction_external_unique').on(table.tenantId, table.bankAccountId, table.externalId),
    index('bank_transaction_status_idx').on(table.tenantId, table.svjId, table.matchStatus),
  ],
);

/**
 * What a movement was decided to be about. It is a row rather than a column on the transaction,
 * because one payment can settle more than one thing and because how it was decided — a rule, an
 * agent, a person — is part of the answer (zadání kap. 7).
 */
export const paymentMatch = svjTable(
  'payment_match',
  {
    transactionId: uuid('transaction_id').notNull(),
    targetType: matchTargetEnum('target_type').notNull(),
    targetId: uuid('target_id').notNull(),
    amount: numeric('amount', MONEY).notNull(),
    method: matchMethodEnum('method').notNull(),
    confidence: numeric('confidence', { precision: 3, scale: 2 }).notNull(),
    approvalId: uuid('approval_id'),
  },
  (table) => [index('payment_match_transaction_idx').on(table.tenantId, table.transactionId)],
);
