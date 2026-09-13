import { createApproval } from './create';
import { decideApproval, expireApprovals } from './decide';
import { getApproval, listApprovals } from './list';

export type { CreateApprovalInput } from './create';
export type { ApprovalDecision, DecisionResult } from './decide';
export type { ApprovalDetail, ApprovalQuery, ApprovalStatus, ApprovalSummary } from './list';

export const approvals = {
  create: createApproval,
  decide: decideApproval,
  expire: expireApprovals,
  list: listApprovals,
  get: getApproval,
} as const;
