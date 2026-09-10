import { and, eq } from 'drizzle-orm';
import type { RequestContext } from '../../context/index';
import { agentDefinition } from '../../db/schema/index';
import { withTenant } from '../../db/tenant';
import { newRowId } from '../../ids/index';
import type { AgentDefinition } from '../definition';

/** Versions are immutable: the same name+version always maps to one stored definition (ADR 0008). */
export const upsertAgentDefinition = async (
  ctx: RequestContext,
  definition: AgentDefinition,
): Promise<string> =>
  withTenant(ctx, async (tx) => {
    const existing = await tx
      .select({ id: agentDefinition.id })
      .from(agentDefinition)
      .where(and(eq(agentDefinition.name, definition.name), eq(agentDefinition.version, definition.version)))
      .limit(1);

    const found = existing[0];
    if (found !== undefined) return found.id;

    const id = newRowId();
    await tx.insert(agentDefinition).values({
      id,
      tenantId: ctx.tenantId,
      name: definition.name,
      version: definition.version,
      source: 'system',
      definition,
      prompt: definition.prompt,
    });
    return id;
  });
