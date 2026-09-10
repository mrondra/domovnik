import { readFileSync } from 'node:fs';
import type { Role } from '../identity/roles';
import type { ModelAlias } from '../tools/definition';

export type Autonomy = 'read' | 'propose' | 'act';
export type AgentScope = 'svj' | 'tenant';

export interface AgentTriggerDefinition {
  readonly event: string;
}

export interface AgentDefinition {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly triggers: readonly AgentTriggerDefinition[];
  readonly schedule?: string | undefined;
  readonly scope: AgentScope;
  readonly model: ModelAlias;
  readonly tools: readonly string[];
  readonly autonomy: Autonomy;
  readonly prompt: string;
  /** Roles of the agent's own identity; the tool set is intersected with their permissions. */
  readonly roles: readonly Role[];
  readonly subagents?: readonly string[] | undefined;
}

const registry = new Map<string, AgentDefinition>();

/** Registration is a side effect of definition — a new agent is a new directory, nothing else. */
export const defineAgent = (definition: AgentDefinition): AgentDefinition => {
  registry.set(definition.name, definition);
  return definition;
};

export const clearAgents = (): void => {
  registry.clear();
};

export const registeredAgents = (): readonly AgentDefinition[] => [...registry.values()];

export const agentsForEvent = (event: string): readonly AgentDefinition[] =>
  registeredAgents().filter((agent) => agent.triggers.some((trigger) => trigger.event === event));

/** `promptFromFile(new URL('./prompt.md', import.meta.url))` keeps the prompt next to the agent. */
export const promptFromFile = (location: URL | string): string => readFileSync(location, 'utf8');
