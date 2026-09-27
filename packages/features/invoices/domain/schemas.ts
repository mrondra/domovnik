import { z } from 'zod';

/**
 * A local copy of `suppliers`' enum, not an import: this file is reachable from `ui/wire.ts`
 * (ADR 0017), and a value import from `suppliers/index` would drag its Nest module — and the
 * native argon2 binary behind `kernel/identity` — into the Next.js build (task 029 review round 3).
 */
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

export const invoiceStatusSchema = z.enum([
  'received',
  'extracted',
  'needs_review',
  'pending_approval',
  'approved',
  'rejected',
  'posted',
  'paid',
]);

export const budgetStatusSchema = z.object({
  svjId: z.uuid(),
  year: z.int(),
  category: budgetCategorySchema,
  planned: z.number(),
  spent: z.number(),
  remaining: z.number(),
});

export const invoiceSchema = z.object({
  id: z.uuid(),
  svjId: z.uuid(),
  status: invoiceStatusSchema,
  supplierId: z.uuid().nullable(),
  contractId: z.uuid().nullable(),
  documentId: z.uuid(),
  externalNumber: z.string().nullable(),
  variableSymbol: z.string().nullable(),
  issuedOn: z.iso.date().nullable(),
  dueOn: z.iso.date().nullable(),
  amountTotal: z.number().nullable(),
  amountVat: z.number().nullable(),
  currency: z.string().min(1),
  budgetCategory: budgetCategorySchema.nullable(),
  agentRunId: z.uuid().nullable(),
  approvalId: z.uuid().nullable(),
  accountingRef: z.string().nullable(),
  receivedAt: z.iso.datetime(),
  source: z.string().min(1),
});
