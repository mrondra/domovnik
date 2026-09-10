import type { AgentRunId, EventId } from '../../ids/index';
import type { TokenUsage } from '../../llm/tracing';

export interface AgentTrigger {
  readonly kind: 'event' | 'schedule' | 'manual';
  readonly name: string;
  readonly payload: unknown;
  readonly eventId?: EventId | undefined;
}

export interface AgentRunOptions {
  readonly tokenBudget?: number | undefined;
  readonly maxTurns?: number | undefined;
}

export type AgentRunStatus = 'succeeded' | 'failed' | 'failed_budget';

export interface AgentRunResult {
  readonly agentRunId: AgentRunId;
  readonly status: AgentRunStatus;
  readonly result: string;
  readonly usage: TokenUsage;
  readonly costUsd: number;
}

/** What one conversation with the harness produced, before it is written to `agent_run`. */
export interface RunOutcome {
  readonly status: AgentRunStatus;
  readonly result: string;
  readonly usage: TokenUsage;
  readonly costUsd: number;
  readonly error?: string | undefined;
}
