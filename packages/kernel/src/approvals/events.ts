import { z } from 'zod';
import { defineEvent } from '../events/definition';

/**
 * The decision, not the action. The deferred tool handler runs in `apps/workers` when this arrives
 * (ADR 0015), so a rejected decision is published too — other features care about both outcomes.
 */
export const approvalDecided = defineEvent(
  'approval.decided',
  z.object({
    approvalId: z.uuid(),
    toolName: z.string(),
    decision: z.enum(['approved', 'rejected']),
    decidedBy: z.uuid().nullable(),
  }),
);
