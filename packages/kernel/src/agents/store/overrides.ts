import { eq } from 'drizzle-orm';
import type { RequestContext } from '../../context/index';
import { agentConfig } from '../../db/schema/index';
import { withTenant } from '../../db/tenant';
import type { ModelAlias } from '../../tools/definition';
import type { Autonomy } from '../definition';

export interface AgentOverrides {
  readonly autonomy?: Autonomy | undefined;
  readonly model?: ModelAlias | undefined;
  readonly isEnabled: boolean;
}

const MODEL_ALIASES = ['sonnet', 'haiku'] as const;

const asModelAlias = (value: string | null): ModelAlias | undefined =>
  MODEL_ALIASES.find((alias) => alias === value);

/** Per-tenant / per-SVJ override of autonomy and model (zadání §6.5); the SVJ row wins. */
export const loadOverrides = async (ctx: RequestContext, agentName: string): Promise<AgentOverrides> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({
        autonomy: agentConfig.autonomy,
        model: agentConfig.model,
        isEnabled: agentConfig.isEnabled,
        svjId: agentConfig.svjId,
      })
      .from(agentConfig)
      .where(eq(agentConfig.agentName, agentName));

    const row =
      rows.find((entry) => entry.svjId !== null && entry.svjId === ctx.svjId) ??
      rows.find((entry) => entry.svjId === null);

    return {
      autonomy: row?.autonomy ?? undefined,
      model: asModelAlias(row?.model ?? null),
      isEnabled: row?.isEnabled ?? true,
    };
  });
