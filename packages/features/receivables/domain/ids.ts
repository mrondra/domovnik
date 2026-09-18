import type { z } from 'zod';
import { brand } from '../../../kernel/src/ids/index';

export const prescriptionIdSchema = brand('PrescriptionId');
export const prescriptionItemIdSchema = brand('PrescriptionItemId');
export const balanceEntryIdSchema = brand('BalanceEntryId');

export type PrescriptionId = z.infer<typeof prescriptionIdSchema>;
export type PrescriptionItemId = z.infer<typeof prescriptionItemIdSchema>;
export type BalanceEntryId = z.infer<typeof balanceEntryIdSchema>;
