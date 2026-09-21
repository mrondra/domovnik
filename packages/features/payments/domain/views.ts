import { z } from 'zod';

/** One zod definition per shape the browser sees, reused by the API and the screens (ADR 0017). */
export const matchStatusSchema = z.enum(['unmatched', 'matched', 'proposed', 'ignored']);

export const transactionSchema = z.object({
  id: z.uuid(),
  svjId: z.uuid(),
  bankAccountId: z.uuid(),
  externalId: z.string().min(1),
  bookedOn: z.iso.date(),
  amount: z.number(),
  counterpartyAccount: z.string().optional(),
  counterpartyName: z.string().optional(),
  variableSymbol: z.string().optional(),
  specificSymbol: z.string().optional(),
  message: z.string().optional(),
  matchStatus: matchStatusSchema,
});

export const candidateSchema = z.object({
  targetType: z.enum(['prescription', 'invoice']),
  targetId: z.uuid(),
  amount: z.number(),
  label: z.string().min(1),
  unitId: z.uuid().optional(),
  because: z.enum(['symbol_typo', 'balance_matches', 'two_months', 'invoice_amount']),
});

export const appliedMatchSchema = z.object({
  targetType: z.enum(['prescription', 'invoice']),
  targetId: z.uuid(),
  amount: z.number(),
  method: z.enum(['vs_amount', 'vs_only', 'agent', 'manual']),
  confidence: z.number(),
});

export const proposalSchema = z.object({
  id: z.uuid(),
  status: z.string().min(1),
  targetType: z.enum(['prescription', 'invoice']),
  targetId: z.uuid(),
  amount: z.number(),
  reason: z.string().min(1),
});

export const transactionDetailSchema = z.object({
  transaction: transactionSchema,
  match: appliedMatchSchema.nullable(),
  proposal: proposalSchema.nullable(),
  candidates: z.array(candidateSchema).readonly(),
});

export const transactionListSchema = z.array(transactionSchema).readonly();

export const manualMatchRequest = z.object({
  targetType: z.enum(['prescription', 'invoice']),
  targetId: z.uuid(),
  amount: z.number().positive(),
});

export const ignoreRequest = z.object({ reason: z.string().min(1).max(400) });

export const transactionQuery = z.object({
  status: matchStatusSchema.optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
});
