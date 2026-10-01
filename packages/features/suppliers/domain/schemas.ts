import { z } from 'zod';
import { specializationSchema } from './specializations';

/** One zod definition per domain shape, reused by the HTTP contract and by `invoices` (task 029). */
export const budgetCategorySchema = z.enum([
  'uklid',
  'vytah',
  'energie',
  'opravy',
  'revize',
  'sprava',
  'pojisteni',
  'ostatni',
]);

export const supplierSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  ico: z.string().min(1),
  dic: z.string().nullable(),
  bankAccount: z.string().nullable(),
  email: z.string().nullable(),
  specializations: z.array(specializationSchema).readonly(),
  phone: z.string().nullable(),
  contactPerson: z.string().nullable(),
  isActive: z.boolean(),
});

export const contractSchema = z.object({
  id: z.uuid(),
  svjId: z.uuid(),
  supplierId: z.uuid(),
  subject: z.string().min(1),
  budgetCategory: budgetCategorySchema,
  monthlyAmount: z.number().nullable(),
  validFrom: z.iso.date(),
  validTo: z.iso.date().nullable(),
  documentId: z.uuid().nullable(),
  covers: z.array(specializationSchema).readonly(),
});
