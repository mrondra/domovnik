import { z } from 'zod';
import { periodSchema } from './period';

/** One zod definition per domain shape, reused by the events, the tools and the HTTP contract. */
export const prescriptionSourceSchema = z.enum(['internal', 'pohoda']);

export const balanceEntryKindSchema = z.enum(['prescription', 'payment', 'adjustment']);

export const entryReferenceSchema = z.object({ type: z.string().min(1), id: z.uuid() });

export const prescriptionItemSchema = z.object({
  id: z.uuid(),
  code: z.string().min(1),
  label: z.string().min(1),
  amount: z.number(),
});

export const prescriptionSchema = z.object({
  id: z.uuid(),
  svjId: z.uuid(),
  unitId: z.uuid(),
  period: periodSchema,
  variableSymbol: z.string().min(1),
  totalAmount: z.number(),
  dueDate: z.iso.date(),
  source: prescriptionSourceSchema,
  items: z.array(prescriptionItemSchema).readonly(),
});

export const balanceEntrySchema = z.object({
  id: z.uuid(),
  unitId: z.uuid(),
  entryDate: z.iso.date(),
  kind: balanceEntryKindSchema,
  amount: z.number(),
  reference: entryReferenceSchema.nullable(),
});

export const unitBalanceSchema = z.object({
  unitId: z.uuid(),
  balance: z.number(),
  oldestUnpaidPeriod: periodSchema.optional(),
  entries: z.array(balanceEntrySchema).readonly(),
});

const planItemSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  basis: z.enum(['per_square_metre', 'per_unit']),
  rate: z.number().nonnegative(),
  rateByKind: z.record(z.string(), z.number().nonnegative()).optional(),
});

/** The last day of February is the 28th in every year, so a plan may not ask for a later one. */
export const prescriptionPlanSchema = z.object({
  items: z.array(planItemSchema).min(1).readonly(),
  dueDayOfMonth: z.int().min(1).max(28),
});
