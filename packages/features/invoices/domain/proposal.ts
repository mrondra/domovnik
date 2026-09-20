import { z } from 'zod';

const SUMMARY_LIMIT = 600;

/**
 * What the agent proposes about an invoice. It is the input of `invoice.approve` and, once the
 * approval exists, the thing a committee member actually reads — so it is defined in the domain
 * and not inside the tool, and both the tool and the detail screen use this one shape (task 018).
 */
export const approveInputSchema = z.object({
  invoiceId: z.uuid(),
  summary: z.string().min(1).max(SUMMARY_LIMIT),
  recommendation: z.enum(['approve', 'reject', 'review']),
  risks: z.array(z.string().min(1)).readonly(),
});

export type ApproveInput = z.output<typeof approveInputSchema>;
