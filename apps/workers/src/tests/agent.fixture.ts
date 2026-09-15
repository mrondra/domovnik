import { vi } from 'vitest';
import type {
  AgentDefinition,
  AgentRunResult,
  AgentTrigger,
} from '../../../../packages/kernel/src/agents/index';
import { createContext, type RequestContext } from '../../../../packages/kernel/src/context/index';
import { agentRunIdSchema, tenantIdSchema } from '../../../../packages/kernel/src/ids/index';

/** Stands in for the real runtime: these tests are about who may run, not about what a run does. */
export const runAgentMock = vi.fn<() => Promise<AgentRunResult>>();

export const agentDefinition = (name: string): AgentDefinition => ({
  name,
  version: '1.0.0',
  description: `Testovací agent ${name}`,
  triggers: [{ event: 'finance.invoice.received' }],
  scope: 'svj',
  model: 'sonnet',
  tools: [],
  autonomy: 'read',
  prompt: 'Role: test.',
  roles: ['manager'],
});

export const tenantContext = (tenantId: string): RequestContext =>
  createContext({
    tenantId: tenantIdSchema.parse(tenantId),
    actor: { type: 'system', id: null, roles: [] },
  });

export const agentRunFor = (eventId: string): AgentTrigger => ({
  kind: 'event',
  name: 'finance.invoice.received',
  payload: { eventId },
});

const DELAY_MS = 5;

const succeeded = (): AgentRunResult => ({
  agentRunId: agentRunIdSchema.parse('00000000-0000-7000-8000-000000000000'),
  status: 'succeeded',
  result: 'hotovo',
  usage: { inputTokens: 0, outputTokens: 0 },
  costUsd: 0,
});

export interface PeakTracker {
  run(): Promise<AgentRunResult>;
  highest(): number;
}

/** Records the highest number of runs that overlapped, which is what the limit is a claim about. */
export const peakTracker = (): PeakTracker => {
  let running = 0;
  let highest = 0;

  return {
    run: async () => {
      running += 1;
      highest = Math.max(highest, running);
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      running -= 1;
      return succeeded();
    },
    highest: () => highest,
  };
};
