import { z } from 'zod';
import { createContext, withAgentRun, type Actor, type RequestContext } from '../../context/index';
import { withTenant } from '../../db/tenant';
import { loadEnv } from '../../env/index';
import { DomainError } from '../../errors/index';
import { events } from '../../events/index';
import { ensureAgentIdentity } from '../../identity/service/index';
import { startTrace } from '../../llm/tracing';
import type { AgentDefinition } from '../definition';
import { agentRunFailed } from '../events';
import { finishAgentRun, loadOverrides, startAgentRun, upsertAgentDefinition } from '../store/index';
import { runSession } from './session';
import { createAgentServer } from './tool-bridge';
import type { AgentRunResult, AgentRunOptions, AgentTrigger, RunOutcome } from './types';

const agentActor = (id: string, definition: AgentDefinition): Actor => ({
  type: 'agent',
  id: z.uuid().brand<'AgentId'>().parse(id),
  roles: definition.roles,
});

const reportFailure = async (
  ctx: RequestContext,
  definition: AgentDefinition,
  outcome: RunOutcome,
): Promise<void> => {
  if (outcome.status === 'succeeded' || ctx.agentRunId === undefined) return;

  await withTenant(ctx, async () => {
    await events.emit(
      ctx,
      agentRunFailed.create({
        agentName: definition.name,
        agentRunId: ctx.agentRunId ?? '',
        reason: outcome.status === 'failed_budget' ? 'failed_budget' : 'failed',
        message: outcome.error ?? 'neznámá chyba',
      }),
    );
  });
};

/**
 * One run of one agent: resolve the per-tenant configuration, open `agent_run`, hand the tool set
 * to the harness, and write down what came back — including the cost (zadání §6.1).
 */
export const runAgent = async (
  ctx: RequestContext,
  definition: AgentDefinition,
  trigger: AgentTrigger,
  options: AgentRunOptions = {},
): Promise<AgentRunResult> => {
  const overrides = await loadOverrides(ctx, definition.name);
  if (!overrides.isEnabled) {
    throw new DomainError(`Agent ${definition.name} je pro tento rozsah vypnutý`, {
      code: 'agent_disabled',
      details: { agent: definition.name },
    });
  }

  const autonomy = overrides.autonomy ?? definition.autonomy;
  const model = overrides.model ?? definition.model;
  const identityId = await ensureAgentIdentity(ctx, {
    agentName: definition.name,
    version: definition.version,
    roles: definition.roles,
  });
  const definitionId = await upsertAgentDefinition(ctx, definition);
  const trace = startTrace(ctx, {
    name: `agent.${definition.name}`,
    metadata: { version: definition.version, autonomy, model },
  });

  const runCtx = createContext({
    tenantId: ctx.tenantId,
    actor: agentActor(identityId, definition),
    correlationId: ctx.correlationId,
    svjId: ctx.svjId,
  });
  const agentRunId = await startAgentRun(runCtx, {
    agentDefinitionId: definitionId,
    agentIdentityId: identityId,
    triggerEventId: trigger.eventId,
    trigger,
    traceId: trace.id,
  });
  const toolCtx = withAgentRun(runCtx, agentRunId);

  const outcome = await runSession({
    definition,
    model,
    trigger,
    server: createAgentServer(toolCtx, definition, autonomy),
    maxTurns: options.maxTurns,
    tokenBudget: options.tokenBudget ?? loadEnv().AGENT_TOKEN_BUDGET,
  });

  await finishAgentRun(toolCtx, agentRunId, outcome);
  trace.end(outcome.result);
  await reportFailure(toolCtx, definition, outcome);

  return { agentRunId, ...outcome };
};
