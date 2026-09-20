import type { ComponentType } from 'react';
import { ApprovalEvidence } from './ApprovalEvidence';

export interface ApprovalEvidenceProps {
  readonly input: unknown;
}

/**
 * How this feature's proposals show themselves in the approval inbox, keyed by tool name. The file
 * name is what `apps/web` discovers by glob, the same way it discovers `ui/navigation.ts`; a
 * feature with nothing to render simply has no such file (task 018).
 */
export const approvalEvidenceRenderers: Readonly<Record<string, ComponentType<ApprovalEvidenceProps>>> = {
  'invoice.approve': ApprovalEvidence,
};
