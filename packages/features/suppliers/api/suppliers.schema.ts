import { z } from 'zod';
import { specializationSchema } from '../domain/specializations';
import { contractSchema, supplierSchema } from '../domain/schemas';

/** The HTTP contract is the domain shape: one zod schema both validates and documents it. */
export const supplierListResponse = z.array(supplierSchema).readonly();
export const supplierResponse = supplierSchema;
export const contractListResponse = z.array(contractSchema).readonly();

/** A query string carries text; `q` matches the supplier name by substring (ILIKE). */
export const supplierQuery = z.object({
  specialization: specializationSchema.optional(),
  q: z.string().min(1).optional(),
});

/** A patch, not a replace: a field left out keeps its current value (service/update.ts). */
export const updateSupplierRequest = z.object({
  name: z.string().min(1).optional(),
  dic: z.string().nullable().optional(),
  bankAccount: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  specializations: z.array(specializationSchema).optional(),
  phone: z.string().nullable().optional(),
  contactPerson: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});
