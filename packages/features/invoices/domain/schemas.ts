import { z } from 'zod';

/** One zod definition per domain shape, reused by the events, the tools and the HTTP contract. */
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
});

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
  receivedAt: z.date(),
  source: z.string().min(1),
});
