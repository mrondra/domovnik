import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import { scenarioKindOf } from '../domain/definition';
import type { ScenarioResult } from '../domain/types';
import { loadDemoModules } from './discovery';
import { scenarioOf } from './registry';

/**
 * Runs one scenario. It is audited like anything else a person does — a demonstration that leaves
 * no trace is indistinguishable from data somebody invented (ADR 0011).
 */
export const runScenario = async (ctx: RequestContext, code: string): Promise<ScenarioResult> => {
  await loadDemoModules();

  return withTenant(ctx, async () => {
    const { kind, payload } = await scenarioOf(ctx, code);
    const definition = scenarioKindOf(kind);
    if (definition === undefined) {
      throw new NotFoundError('Druh demo scénáře není zaregistrovaný', {
        code: 'demo_kind_unknown',
        details: { kind },
      });
    }

    const result = await definition.run(ctx, code, definition.payload.parse(payload));

    await audit.record(ctx, {
      action: 'demo.scenario.run',
      entity: 'demo_scenario',
      reason: `Spuštěn demo scénář ${code}`,
      after: { code, outcome: result.outcome, link: result.link },
    });

    return result;
  });
};
