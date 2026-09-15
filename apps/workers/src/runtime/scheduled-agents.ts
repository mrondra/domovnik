import { registeredAgents, type AgentDefinition } from '../../../../packages/kernel/src/agents/index';
import { createContext } from '../../../../packages/kernel/src/context/index';
import { listActiveTenants } from '../../../../packages/kernel/src/identity/index';
import { logger } from '../../../../packages/kernel/src/logger/index';
import type { AgentRunner } from './agent-runner';

export interface ScheduledAgent {
  readonly definition: AgentDefinition;
  readonly cron: string;
}

/** `flatMap` rather than `filter`, so the cron is a `string` here instead of a maybe-string. */
export const scheduledAgents = (): readonly ScheduledAgent[] =>
  registeredAgents().flatMap((definition) =>
    definition.schedule === undefined ? [] : [{ definition, cron: definition.schedule }],
  );

/**
 * A cron fires once; the agent runs once per tenant. Every run goes through the same runner as an
 * event-triggered one, so the per-agent and per-tenant limits hold here too — without them a nightly
 * agent would start as many runs at once as there are tenants.
 */
export const runAgentForEveryTenant = async (
  runner: AgentRunner,
  definition: AgentDefinition,
): Promise<void> => {
  const tenants = await listActiveTenants();
  logger().info({ agent: definition.name, tenants: tenants.length }, 'Scheduled agent starting');

  await Promise.all(
    tenants.map((tenantId) =>
      runner(createContext({ tenantId, actor: { type: 'system', id: null, roles: [] } }), definition, {
        kind: 'schedule',
        name: definition.name,
        payload: {},
      }),
    ),
  );
};
