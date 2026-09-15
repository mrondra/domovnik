import { z } from 'zod';
import { callApi, readApi, type ApiResult } from './client';

/**
 * The shapes the API publishes (`apps/api/src/approvals/approvals.schema.ts`). They are restated
 * here rather than imported: one application must not reach into another's source (AGENTS.md §2),
 * and parsing the answer is what keeps the two honest with each other.
 */
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
  executedAt: z.iso.datetime().nullable(),
});

const inboxSchema = z.array(approvalSummarySchema);
const decisionResultSchema = z.object({ status: z.enum(['approved', 'rejected']) });

export type ApprovalStatus = z.output<typeof approvalStatusSchema>;
export type ApprovalSummary = z.output<typeof approvalSummarySchema>;
export type ApprovalDetail = z.output<typeof approvalDetailSchema>;

export interface InboxQuery {
  readonly status?: ApprovalStatus | undefined;
  readonly svjId?: string | undefined;
}

export const listApprovals = (query: InboxQuery = {}): Promise<readonly ApprovalSummary[]> =>
  readApi(`/approvals?status=${query.status ?? 'pending'}`, inboxSchema, { svjId: query.svjId });

export const getApproval = (id: string, svjId?: string): Promise<ApprovalDetail> =>
  readApi(`/approvals/${id}`, approvalDetailSchema, { svjId });

export interface Decision {
  readonly decision: 'approved' | 'rejected';
  readonly comment?: string | undefined;
}

export const decideApproval = (
  id: string,
  body: Decision,
): Promise<ApiResult<z.output<typeof decisionResultSchema>>> =>
  callApi(`/approvals/${id}/decide`, decisionResultSchema, { method: 'POST', body });

/** The signed link from an e-mail: a GET that only renders, and a POST that decides (zadání kap. 2). */
export const previewSignedLink = (token: string): Promise<ApprovalDetail> =>
  readApi(`/a/${encodeURIComponent(token)}`, approvalDetailSchema);

export const decideBySignedLink = (
  token: string,
  body: Decision,
): Promise<ApiResult<z.output<typeof decisionResultSchema>>> =>
  callApi(`/a/${encodeURIComponent(token)}/decide`, decisionResultSchema, { method: 'POST', body });
