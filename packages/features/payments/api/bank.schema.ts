import { z } from 'zod';

/** The HTTP contract is the domain shape: one zod schema both validates and documents it. */
export const bankAccountResponse = z.object({
  id: z.uuid(),
  svjId: z.uuid(),
  iban: z.string().nullable(),
  number: z.string().min(1),
  bankCode: z.string().min(1),
  label: z.string().min(1),
  isPrimary: z.boolean(),
});

export const bankAccountListResponse = z.array(bankAccountResponse).readonly();

export const syncRequest = z.object({ from: z.iso.date(), to: z.iso.date() });

export const syncResponse = z.object({
  count: z.int().nonnegative(),
  newCount: z.int().nonnegative(),
  matchedCount: z.int().nonnegative(),
  unmatched: z.array(z.uuid()).readonly(),
});
