import {
  runAgent,
  type AgentDefinition,
  type AgentTrigger,
} from '../../../../packages/kernel/src/agents/index';
import type { RequestContext } from '../../../../packages/kernel/src/context/index';
import { isKernelError } from '../../../../packages/kernel/src/errors/index';
import { agentLimits } from '../../../../packages/kernel/src/events/index';
import { logger } from '../../../../packages/kernel/src/logger/index';
import { createGate } from './limiter';

export type AgentRunner = (
  ctx: RequestContext,
  definition: AgentDefinition,
  trigger: AgentTrigger,
) => Promise<void>;

const DISABLED = 'agent_disabled';

/** Being switched off for this tenant is a configuration answer, not a delivery failure to retry. */
const isDisabled = (error: unknown): boolean => isKernelError(error) && error.code === DISABLED;

const run = async (
  ctx: RequestContext,
  definition: AgentDefinition,
  trigger: AgentTrigger,
): Promise<void> => {
  try {
    const result = await runAgent(ctx, definition, trigger);
    const { agentRunId, status, costUsd } = result;
    logger().info({ agent: definition.name, agentRunId, status, costUsd }, 'Agent run finished');
  } catch (error) {
    if (!isDisabled(error)) throw error;
    logger().debug({ agent: definition.name }, 'Agent is switched off for this scope');
  }
};

/**
 * The one place an agent is ever started. Both limits apply to every run whatever set it off — an
 * event, a schedule — because a tenant's budget is not divided by how the run was triggered.
 */
export const createAgentRunner = (): AgentRunner => {
  const limits = agentLimits();
  const perAgent = createGate(limits.perAgent);
  const perTenant = createGate(limits.perTenant);

  return (ctx, definition, trigger) =>
    perAgent(definition.name, () => perTenant(ctx.tenantId, () => run(ctx, definition, trigger)));
};
