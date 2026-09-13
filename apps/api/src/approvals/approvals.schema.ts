import { z } from 'zod';

export const approvalStatusSchema = z.enum(['pending', 'approved', 'rejected', 'expired']);

export const approvalSummarySchema = z.object({
  id: z.uuid(),
  toolName: z.string(),
  status: approvalStatusSchema,
  approvers: z.array(z.string()),
  deadline: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

export const approvalDetailSchema = approvalSummarySchema.extend({
  input: z.unknown(),
  evidence: z.unknown(),
  comment: z.string().nullable(),
  result: z.unknown(),
});

export const inboxQuerySchema = z.object({ status: approvalStatusSchema.optional() });

export const decisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  comment: z.string().max(2000).optional(),
});

export const decisionResultSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  output: z.unknown(),
});
