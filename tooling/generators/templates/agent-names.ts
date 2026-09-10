import type { Names } from '../lib/names';

export interface AgentInput {
  readonly feature: Names;
  readonly agent: Names;
}

/** Agent triggers are batched, present-tense events: `demo.records.pending` (ADR 0004). */
export const triggerEvent = (input: AgentInput): string => `${input.feature.snake}.records.pending`;
