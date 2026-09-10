import { z } from 'zod';
import { defineEvent } from '../events/definition';

/** The kernel does not know what a task is; it reports the failure and a feature reacts to it. */
export const agentRunFailed = defineEvent(
  'agent.run.failed',
  z.object({
    agentName: z.string(),
    agentRunId: z.uuid(),
    reason: z.enum(['failed', 'failed_budget']),
    message: z.string(),
  }),
);
