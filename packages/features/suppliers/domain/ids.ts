import type { z } from 'zod';
import { brand } from '../../../kernel/src/ids/index';

export const supplierIdSchema = brand('SupplierId');
export const contractIdSchema = brand('ContractId');

export type SupplierId = z.infer<typeof supplierIdSchema>;
export type ContractId = z.infer<typeof contractIdSchema>;
