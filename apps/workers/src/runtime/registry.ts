import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAgentsFrom, registeredAgents } from '../../../../packages/kernel/src/agents/index';
import { loadSubscribersFrom } from '../../../../packages/kernel/src/events/index';
import { loadToolsFrom } from '../../../../packages/kernel/src/tools/index';

const TOOL_FILES = 'packages/features/*/tools/*.ts';
const AGENT_FILES = 'packages/features/*/agents/*/agent.ts';
const SUBSCRIBER_FILES = 'packages/features/*/subscribers/*.ts';

const repoRoot = (): string => fileURLToPath(new URL('../../../../', import.meta.url));

export interface LoadedRegistry {
  readonly tools: number;
  readonly agents: number;
  readonly subscribers: number;
}

/**
 * By convention, not by a list: importing the file is what calls `defineTool`/`defineAgent`, so a new
 * agent is a new directory and nothing here changes (ADR 0008, zadání §6.1). The tools come first —
 * an agent definition names the tools it may use, and the registry has to be able to answer.
 *
 * A subscriber file registers its handler when it is imported, so loading it here is what puts the
 * feature's plain event handlers in front of `startEventWorkers`.
 */
export const loadFeatureRegistry = async (): Promise<LoadedRegistry> => {
  const root = repoRoot();
  const tools = await loadToolsFrom([join(root, TOOL_FILES)]);
  const subscribers = await loadSubscribersFrom([join(root, SUBSCRIBER_FILES)]);
  await loadAgentsFrom([join(root, AGENT_FILES)]);

  return { tools, agents: registeredAgents().length, subscribers };
};
