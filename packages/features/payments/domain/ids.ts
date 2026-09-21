import type { z } from 'zod';
import { brand } from '../../../kernel/src/ids/index';

export const bankAccountIdSchema = brand('BankAccountId');
export const bankTransactionIdSchema = brand('BankTransactionId');

export type BankAccountId = z.infer<typeof bankAccountIdSchema>;
export type BankTransactionId = z.infer<typeof bankTransactionIdSchema>;
