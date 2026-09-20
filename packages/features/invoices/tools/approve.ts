import { z } from 'zod';
import { approvalIdSchema } from '../../../kernel/src/ids/index';
import { defineTool } from '../../../kernel/src/tools/index';
import { invoiceIdSchema } from '../domain/ids';
import { approveInputSchema } from '../domain/proposal';
import { approveInvoice, committeeOf, decideBy, requestApproval } from '../service/index';

/**
 * A proposal, never an act: the policy always asks, so the handler runs only after the committee
 * has decided, and it runs in `apps/workers` (ADR 0006, ADR 0015). What the agent produces is the
 * sentence a person reads before deciding — the numbers were already settled by the checks.
 *
 * A rejected decision never reaches the handler at all; `subscribers/on-approval-rejected.ts` is
 * what moves the invoice then.
 */
export const invoiceApprove = defineTool({
  name: 'invoice.approve',
  description:
    'Předloží fakturu výboru SVJ ke schválení: shrnutí pro laika, doporučení (approve, reject, ' +
    'review) a seznam rizik. Nic neschvaluje — založí návrh, o kterém rozhoduje výbor. ' +
    'Použij pro fakturu, která prošla kontrolami.',
  input: approveInputSchema,
  output: z.object({ invoiceId: z.uuid(), status: z.string().min(1) }),
  permission: 'finance.approve',
  userComposable: false,
  readOnly: false,
  proposal: true,
  approval: async (ctx, input) => ({
    required: true,
    approvers: await committeeOf(ctx, invoiceIdSchema.parse(input.invoiceId)),
    deadline: decideBy(),
  }),
  onApprovalRequested: async (ctx, input, approvalId) => {
    await requestApproval(ctx, invoiceIdSchema.parse(input.invoiceId), approvalIdSchema.parse(approvalId));
  },
  handler: async (ctx, input) => {
    const approved = await approveInvoice(
      ctx,
      invoiceIdSchema.parse(input.invoiceId),
      `Schváleno výborem: ${input.summary}`,
    );
    return { invoiceId: approved.id, status: approved.status };
  },
});
