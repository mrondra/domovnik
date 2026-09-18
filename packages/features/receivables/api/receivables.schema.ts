import { z } from 'zod';
import { prescriptionSchema, unitBalanceSchema } from '../domain/schemas';

/** The HTTP contract is the domain shape: one zod schema both validates and documents it. */
export const prescriptionListResponse = z.array(prescriptionSchema).readonly();
export const unitBalanceResponse = unitBalanceSchema;
export const debtorListResponse = z.array(unitBalanceSchema).readonly();

const MONTHS = 12;

/** A query string carries text; the period a caller asks for is two numbers or it is nothing. */
export const periodQuery = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(MONTHS),
});

export const debtorQuery = z.object({ minDebt: z.coerce.number().nonnegative().default(1) });
