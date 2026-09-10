import { and, eq } from 'drizzle-orm';
import type { RequestContext } from '../../context/index';
import { agentIdentity } from '../../db/schema/index';
import { withTenant } from '../../db/tenant';
import { agentIdSchema, newId, type AgentId } from '../../ids/index';
import type { Role } from '../roles';

export interface AgentIdentityInput {
  readonly agentName: string;
  readonly version: string;
  readonly roles: readonly Role[];
}

/** One identity per agent name and version, so `agent_run` always points at a real actor. */
export const ensureAgentIdentity = async (ctx: RequestContext, input: AgentIdentityInput): Promise<AgentId> =>
  withTenant(ctx, async (tx) => {
    const existing = await tx
      .select({ id: agentIdentity.id })
      .from(agentIdentity)
      .where(and(eq(agentIdentity.agentName, input.agentName), eq(agentIdentity.version, input.version)))
      .limit(1);

    const found = existing[0];
    if (found !== undefined) return agentIdSchema.parse(found.id);

    const id = newId(agentIdSchema);
    await tx.insert(agentIdentity).values({
      id,
      tenantId: ctx.tenantId,
      agentName: input.agentName,
      version: input.version,
      roles: input.roles,
    });
    return id;
  });
