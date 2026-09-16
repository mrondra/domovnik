import { v7 as uuidv7 } from 'uuid';
import type { AgentId, AgentRunId, SvjId, TenantId, UserId } from '../ids/identifiers';
import type { Role } from '../identity/roles';

export type ActorType = 'user' | 'agent' | 'system';

/** Agents are actors just like people (zadání §2.1); `system` covers migrations and schedulers. */
export type Actor =
  | { readonly type: 'user'; readonly id: UserId; readonly roles: readonly Role[] }
  | { readonly type: 'agent'; readonly id: AgentId; readonly roles: readonly Role[] }
  | { readonly type: 'system'; readonly id: null; readonly roles: readonly Role[] };

export interface RequestContext {
  readonly tenantId: TenantId;
  readonly actor: Actor;
  readonly correlationId: string;
  readonly svjId?: SvjId | undefined;
  /** What the credential confines the actor to; `undefined` is the whole tenant (ADR 0016). */
  readonly svjScope?: readonly SvjId[] | undefined;
  readonly agentRunId?: AgentRunId | undefined;
}

export interface CreateContextInput {
  readonly tenantId: TenantId;
  readonly actor: Actor;
  readonly correlationId?: string;
  readonly svjId?: SvjId | undefined;
  readonly svjScope?: readonly SvjId[] | undefined;
  readonly agentRunId?: AgentRunId | undefined;
}

export const createContext = (input: CreateContextInput): RequestContext => ({
  tenantId: input.tenantId,
  actor: input.actor,
  correlationId: input.correlationId ?? uuidv7(),
  svjId: input.svjId,
  svjScope: input.svjScope,
  agentRunId: input.agentRunId,
});

export const withCorrelation = (ctx: RequestContext, correlationId: string): RequestContext => ({
  ...ctx,
  correlationId,
});

export const withSvj = (ctx: RequestContext, svjId: SvjId): RequestContext => ({ ...ctx, svjId });

export const withAgentRun = (ctx: RequestContext, agentRunId: AgentRunId): RequestContext => ({
  ...ctx,
  agentRunId,
});
