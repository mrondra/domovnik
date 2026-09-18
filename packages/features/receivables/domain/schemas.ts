import { z } from 'zod';

/** One zod definition per domain shape, reused by the events and (from 013) the tools. */
export const prescriptionSourceSchema = z.enum(['internal', 'pohoda']);

export const balanceEntryKindSchema = z.enum(['prescription', 'payment', 'adjustment']);

export const entryReferenceSchema = z.object({ type: z.string().min(1), id: z.uuid() });

export const planItemSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  basis: z.enum(['per_square_metre', 'per_unit']),
  rate: z.number().nonnegative(),
});

export const prescriptionPlanSchema = z.object({
  items: z.array(planItemSchema).min(1).readonly(),
  dueDayOfMonth: z.int().min(1).max(28),
});
