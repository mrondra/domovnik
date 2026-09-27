import type { z } from 'zod';
import type { RequestContext } from '../../../kernel/src/context/index';
import { DomainError } from '../../../kernel/src/errors/index';
import type { ScenarioResult } from './types';

/**
 * What a feature adds when it wants the demo to be able to show something: a kind, the payload
 * shape that describes one occurrence of it, and what running it does. `demo` never names the
 * feature back — `feature` is here only so `resetDemo` can order the reset the same way the seed
 * that wrote the scenario was ordered (task 028).
 */
export interface ScenarioKindDefinition<P extends z.ZodType = z.ZodType> {
  readonly kind: string;
  readonly feature: string;
  readonly payload: P;
  readonly run: (ctx: RequestContext, code: string, payload: z.output<P>) => Promise<ScenarioResult>;
}

const scenarioKinds = new Map<string, ScenarioKindDefinition>();

/**
 * Registration is a side effect of definition, the same as `defineTool` (AGENTS.md §6): a feature
 * adds a scenario kind by writing `demo/<kind>.ts`, and `demo` discovers the file instead of
 * importing it by name.
 */
export const defineScenarioKind = <P extends z.ZodType>(
  definition: ScenarioKindDefinition<P>,
): ScenarioKindDefinition<P> => {
  if (scenarioKinds.has(definition.kind)) {
    throw new DomainError('Druh demo scénáře je zaregistrovaný podvakrát', {
      code: 'demo_kind_duplicate',
      details: { kind: definition.kind },
    });
  }
  scenarioKinds.set(definition.kind, definition);
  return definition;
};

export const scenarioKindOf = (kind: string): ScenarioKindDefinition | undefined => scenarioKinds.get(kind);

export const clearScenarioKinds = (): void => {
  scenarioKinds.clear();
};

/**
 * What a feature throws away when a demonstration is reset. `run` returns how many rows it
 * removed, the same contract the old `HANDLERS` functions already had (task 026).
 */
export interface DemoResetDefinition {
  readonly feature: string;
  readonly run: (ctx: RequestContext) => Promise<number>;
}

const demoResets = new Map<string, DemoResetDefinition>();

/** Registration is a side effect of definition; a second registration for the same feature replaces the first. */
export const defineDemoReset = (definition: DemoResetDefinition): DemoResetDefinition => {
  demoResets.set(definition.feature, definition);
  return definition;
};

export const registeredDemoResets = (): readonly DemoResetDefinition[] => [...demoResets.values()];

export const clearDemoResets = (): void => {
  demoResets.clear();
};
