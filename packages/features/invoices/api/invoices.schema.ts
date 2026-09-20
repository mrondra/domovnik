import { z } from 'zod';
import { approveInputSchema } from '../domain/proposal';
import { budgetStatusSchema, contractSchema, invoiceSchema, invoiceStatusSchema } from '../domain/schemas';

/** The HTTP contract is the domain shape: one zod schema both validates and documents it. */
export const invoiceListResponse = z.array(invoiceSchema).readonly();

export const supplierResponse = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  ico: z.string().min(1),
  dic: z.string().nullable(),
  bankAccount: z.string().nullable(),
  email: z.string().nullable(),
});

export const supplierListResponse = z.array(supplierResponse).readonly();
export const contractListResponse = z.array(contractSchema).readonly();

export const agentRunResponse = z.object({
  id: z.uuid(),
  status: z.string().min(1),
  traceId: z.string().nullable(),
  model: z.string().nullable(),
  inputTokens: z.int().nonnegative(),
  outputTokens: z.int().nonnegative(),
});

/** What the agent proposed, without the invoice id it is already next to. */
export const proposalResponse = approveInputSchema.omit({ invoiceId: true }).extend({
  id: z.uuid(),
  status: z.string().min(1),
});

export const invoiceDetailResponse = z.object({
  invoice: invoiceSchema,
  extraction: z.unknown(),
  checks: z.unknown(),
  supplier: supplierResponse.nullable(),
  contract: contractSchema.nullable(),
  budget: budgetStatusSchema.nullable(),
  agentRun: agentRunResponse.nullable(),
  approval: proposalResponse.nullable(),
  downloadUrl: z.url().nullable(),
});

/** A query string carries text, and an unknown status is a typo rather than an empty answer. */
export const invoiceQuery = z.object({ status: invoiceStatusSchema.optional() });
