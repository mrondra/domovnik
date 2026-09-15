import { z } from 'zod';
import { approvals } from '../../../../packages/kernel/src/approvals/index';
import type { RequestContext } from '../../../../packages/kernel/src/context/index';
import type { ApprovalId } from '../../../../packages/kernel/src/ids/index';
import { clearTools, defineTool } from '../../../../packages/kernel/src/tools/index';

export const LETTER_TOOL = 'letter.send';

/** One deferred tool, so a decision has something real to run (ADR 0006). */
export const registerLetterTool = (): void => {
  clearTools();
  defineTool({
    name: LETTER_TOOL,
    description: 'Odešle dopis vlastníkovi.',
    input: z.object({ to: z.string() }),
    output: z.object({ sent: z.boolean() }),
    permission: 'comms.send',
    approval: () => ({ required: true, approvers: [] }),
    userComposable: false,
    readOnly: false,
    handler: () => Promise.resolve({ sent: true }),
  });
};

export const openApproval = (ctx: RequestContext, approvers: readonly string[]): Promise<ApprovalId> =>
  approvals.create(ctx, {
    toolName: LETTER_TOOL,
    input: { to: 'Novák' },
    evidence: { reason: 'dluh' },
    approvers,
  });

export const decisionSchema = z.object({ status: z.string() });

export const approvalDetailSchema = z.object({
  id: z.uuid(),
  toolName: z.string(),
  status: z.string(),
});
