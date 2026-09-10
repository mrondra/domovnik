import { eq, sql } from 'drizzle-orm';
import type { RequestContext } from '../../context/index';
import { agentRun } from '../../db/schema/index';
import { withTenant } from '../../db/tenant';
import { agentRunIdSchema, newId, type AgentId, type AgentRunId } from '../../ids/index';
import type { RunOutcome } from '../runtime/types';

export interface StartRunInput {
  readonly agentDefinitionId: string;
  readonly agentIdentityId: AgentId;
  readonly triggerEventId?: string | undefined;
  readonly trigger: unknown;
  readonly traceId: string;
}

export const startAgentRun = async (ctx: RequestContext, input: StartRunInput): Promise<AgentRunId> => {
  const id = newId(agentRunIdSchema);
  await withTenant(ctx, async (tx) => {
    await tx.insert(agentRun).values({
      id,
      tenantId: ctx.tenantId,
      agentDefinitionId: input.agentDefinitionId,
      agentIdentityId: input.agentIdentityId,
      svjId: ctx.svjId ?? null,
      triggerEventId: input.triggerEventId ?? null,
      trigger: input.trigger,
      status: 'running',
      traceId: input.traceId,
    });
  });
  return id;
};

export const finishAgentRun = async (
  ctx: RequestContext,
  agentRunId: AgentRunId,
  outcome: RunOutcome,
): Promise<void> => {
  await withTenant(ctx, async (tx) => {
    await tx
      .update(agentRun)
      .set({
        status: outcome.status,
        result: outcome.result,
        inputTokens: outcome.usage.inputTokens,
        outputTokens: outcome.usage.outputTokens,
        costUsd: outcome.costUsd.toFixed(6),
        error: outcome.error ?? null,
        finishedAt: sql`now()`,
      })
      .where(eq(agentRun.id, agentRunId));
  });
};
