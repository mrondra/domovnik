import { createApproval } from './create';
import { decideApproval, expireApprovals } from './decide';

export type { CreateApprovalInput } from './create';
export type { ApprovalDecision, DecisionResult } from './decide';

export const approvals = {
  create: createApproval,
  decide: decideApproval,
  expire: expireApprovals,
} as const;
