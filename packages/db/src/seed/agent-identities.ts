import { join } from 'node:path';
import { loadAgentsFrom, registeredAgents } from '../../../kernel/src/agents/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { ensureAgentIdentity } from '../../../kernel/src/identity/index';
import { repoRoot } from '../paths';

const AGENT_FILES = 'packages/features/*/agents/*/agent.ts';

/**
 * Agents are actors: an `agent_run` has to point at a real identity, so every tenant gets one per
 * agent name and version. Discovery is by convention, nothing is imported by hand (ADR 0008).
 */
export const seedAgentIdentities = async (ctx: RequestContext): Promise<number> => {
  await loadAgentsFrom([join(repoRoot(), AGENT_FILES)]);
  const agents = registeredAgents();

  for (const agent of agents) {
    await ensureAgentIdentity(ctx, {
      agentName: agent.name,
      version: agent.version,
      roles: agent.roles,
    });
  }

  return agents.length;
};
