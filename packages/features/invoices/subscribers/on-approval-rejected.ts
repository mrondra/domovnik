import { z } from 'zod';
import { approvals, approvalDecided } from '../../../kernel/src/approvals/index';
import { subscribe } from '../../../kernel/src/events/index';
import { approvalIdSchema } from '../../../kernel/src/ids/index';
import { invoiceIdSchema } from '../domain/ids';
import { rejectInvoice } from '../service/index';
import { invoiceApprove } from '../tools/approve';

const approveInputSchema = z.object({ invoiceId: z.uuid() });

/**
 * An approved decision resumes the tool handler in the kernel (ADR 0015); a rejected one resumes
 * nothing, because there is nothing to carry out. But the invoice still has to move, and only this
 * feature knows where to — so it listens for the decision it does not get told about any other way.
 *
 * Delivery is at-least-once. `transition` refuses a step the machine does not allow, so a second
 * delivery finds the invoice already `rejected` and leaves it there.
 */
export const onApprovalRejected = subscribe(
  approvalDecided.name,
  async (ctx, event) => {
    const payload = approvalDecided.schema.parse(event.payload);
    if (payload.decision !== 'rejected' || payload.toolName !== invoiceApprove.name) return;

    const approval = await approvals.get(ctx, approvalIdSchema.parse(payload.approvalId));
    const input = approveInputSchema.parse(approval.input);

    await rejectInvoice(
      ctx,
      invoiceIdSchema.parse(input.invoiceId),
      approval.comment ?? 'Výbor fakturu zamítl',
    );
  },
  { subscriber: 'invoices.on-approval-rejected' },
);
