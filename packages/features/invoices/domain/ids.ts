import type { z } from 'zod';
import { brand } from '../../../kernel/src/ids/index';

export const budgetLineIdSchema = brand('BudgetLineId');
export const invoiceIdSchema = brand('InvoiceId');

export type InvoiceId = z.infer<typeof invoiceIdSchema>;
