import type { z } from 'zod';
import { brand } from '../../../kernel/src/ids/index';

export const supplierIdSchema = brand('SupplierId');
export const contractIdSchema = brand('ContractId');
export const budgetLineIdSchema = brand('BudgetLineId');
export const invoiceIdSchema = brand('InvoiceId');

export type SupplierId = z.infer<typeof supplierIdSchema>;
export type ContractId = z.infer<typeof contractIdSchema>;
export type InvoiceId = z.infer<typeof invoiceIdSchema>;
