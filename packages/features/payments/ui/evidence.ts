import type { ComponentType } from 'react';
import { ApprovalEvidence } from './ApprovalEvidence';

export interface ApprovalEvidenceProps {
  readonly input: unknown;
}

/** How this feature's proposals show themselves in the approval inbox, keyed by tool name. */
export const approvalEvidenceRenderers: Readonly<Record<string, ComponentType<ApprovalEvidenceProps>>> = {
  'payment.proposeMatch': ApprovalEvidence,
};
