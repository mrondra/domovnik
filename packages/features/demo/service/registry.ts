import { asc, eq } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import { newRowId } from '../../../kernel/src/ids/index';
import { demoScenario } from '../schema';
import { scenarioKindSchema, type RegisterScenarioInput, type Scenario } from '../domain/types';

/**
 * Idempotent by `(tenant, code)`: a seed that runs twice leaves one scenario, and a scenario whose
 * wording was improved is updated rather than duplicated (docs/engineering.md §8).
 */
export const registerScenario = (ctx: RequestContext, input: RegisterScenarioInput): Promise<void> =>
  withTenant(ctx, async (tx) => {
    const { code, title, description, kind, payload } = input;

    await tx
      .insert(demoScenario)
      .values({ id: newRowId(), tenantId: ctx.tenantId, code, title, description, kind, payload })
      .onConflictDoUpdate({
        target: [demoScenario.tenantId, demoScenario.code],
        set: { title, description, kind, payload },
      });
  });

export const listScenarios = (ctx: RequestContext): Promise<readonly Scenario[]> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select().from(demoScenario).orderBy(asc(demoScenario.code));

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      kind: scenarioKindSchema.parse(row.kind),
    }));
  });

export interface StoredScenario {
  readonly kind: string;
  readonly payload: unknown;
}

export const scenarioOf = (ctx: RequestContext, code: string): Promise<StoredScenario> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({ kind: demoScenario.kind, payload: demoScenario.payload })
      .from(demoScenario)
      .where(eq(demoScenario.code, code))
      .limit(1);

    const row = rows[0];
    if (row === undefined) {
      throw new NotFoundError('Demo scénář neexistuje', {
        code: 'demo_scenario_not_found',
        details: { scenario: code },
      });
    }
    return row;
  });
