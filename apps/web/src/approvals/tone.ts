import type { BadgeTone } from '../../../../packages/shared/src/ui/elements/index';
import type { ApprovalStatus } from '../api/approvals';

const TONES: Readonly<Record<ApprovalStatus, BadgeTone>> = {
  pending: 'pending',
  approved: 'positive',
  rejected: 'negative',
  expired: 'neutral',
};

export const toneOf = (status: ApprovalStatus): BadgeTone => TONES[status];
