import { createApproval } from './create';
import { decideApproval, expireApprovals } from './decide';
import { getApproval, listApprovals } from './list';
import { resumeApproval } from './resume';

export type { CreateApprovalInput } from './create';
export type { ApprovalDecision, DecisionResult } from './decide';
export type { ApprovalDetail, ApprovalQuery, ApprovalStatus, ApprovalSummary } from './list';
export { approvalDecided } from './events';
export { subscribeApprovalResume } from './resume';

export const approvals = {
  create: createApproval,
  decide: decideApproval,
  expire: expireApprovals,
  list: listApprovals,
  get: getApproval,
  resume: resumeApproval,
} as const;
