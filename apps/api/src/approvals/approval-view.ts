import type { ApprovalDetail, ApprovalSummary } from '../../../../packages/kernel/src/approvals/index';
import type { z } from 'zod';
import type { approvalDetailSchema, approvalSummarySchema } from './approvals.schema';

/** Dates leave the API as ISO strings; everything else is already the shape the schema publishes. */
export const toSummary = (row: ApprovalSummary): z.output<typeof approvalSummarySchema> => ({
  id: row.id,
  toolName: row.toolName,
  status: row.status,
  approvers: [...row.approvers],
  deadline: row.deadline?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
});

export const toDetail = (row: ApprovalDetail): z.output<typeof approvalDetailSchema> => ({
  ...toSummary(row),
  input: row.input,
  evidence: row.evidence,
  comment: row.comment,
  result: row.result,
  executedAt: row.executedAt?.toISOString() ?? null,
});
