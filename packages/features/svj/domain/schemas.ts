import { z } from 'zod';

/** One zod definition per domain shape, reused by the events, the tools and the HTTP contract. */
export const unitKindSchema = z.enum(['apartment', 'commercial', 'garage']);

export const shareSchema = z.object({
  numerator: z.int().positive(),
  denominator: z.int().positive(),
});

export const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
});

export const svjSummarySchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  unitCount: z.int().nonnegative(),
});

export const svjSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  ico: z.string().min(1),
  address: addressSchema,
  committee: z.array(z.uuid()).readonly(),
  bankAccounts: z.array(z.string()).readonly(),
});

export const unitSchema = z.object({
  id: z.uuid(),
  svjId: z.uuid(),
  buildingId: z.uuid(),
  number: z.string().min(1),
  kind: unitKindSchema,
  share: shareSchema,
  floorArea: z.number().positive(),
});

export const departmentSchema = z.object({
  id: z.uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
});

/** What crosses the wire: the same shapes without the branded ids, which only the service uses. */
export type SvjSummaryView = z.output<typeof svjSummarySchema>;
export type SvjView = z.output<typeof svjSchema>;
export type UnitView = z.output<typeof unitSchema>;
