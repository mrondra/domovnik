import { z } from 'zod';

/**
 * What the agent proposes about one movement. It is the input of `payment.proposeMatch` and, once
 * the approval exists, the thing an accountant reads — so it is defined here and both the tool and
 * the inbox use this one shape (task 022).
 */
export const proposeMatchSchema = z.object({
  transactionId: z.uuid(),
  targetType: z.enum(['prescription', 'invoice']),
  targetId: z.uuid(),
  amount: z.number().positive(),
  /** Czech, for a person who is looking at a bank statement and not at this code. */
  reason: z.string().min(1).max(400),
});
