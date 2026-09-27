import { Injectable } from '@nestjs/common';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { ResetResult, Scenario, ScenarioResult } from '../domain/types';
import { listScenarios } from './registry';
import { resetDemo } from './reset';
import { runScenario } from './run';

/**
 * The injectable face of this feature. It holds no state and no queries of its own: every method is
 * the module next to it, so a seed can call the same function without going through Nest. Every
 * `demo/*.ts`/`seed/*.seed.ts` scenario kind and reset is registered before this class is even
 * loaded — `apps/api`'s `bootstrap.ts` statically imports the generated registry first
 * (`apps/api/src/demo/registry.generated.ts`, `pnpm api:modules`).
 */
@Injectable()
export class DemoService {
  list(ctx: RequestContext): Promise<readonly Scenario[]> {
    return listScenarios(ctx);
  }

  run(ctx: RequestContext, code: string): Promise<ScenarioResult> {
    return runScenario(ctx, code);
  }

  reset(ctx: RequestContext): Promise<ResetResult> {
    return resetDemo(ctx);
  }
}
