import { Injectable } from '@nestjs/common';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { Scenario, ScenarioResult } from '../domain/types';
import { listScenarios } from './registry';
import { runScenario } from './run';

/**
 * The injectable face of this feature. It holds no state and no queries of its own: every method is
 * the module next to it, so a seed can call the same function without going through Nest.
 */
@Injectable()
export class DemoService {
  list(ctx: RequestContext): Promise<readonly Scenario[]> {
    return listScenarios(ctx);
  }

  run(ctx: RequestContext, code: string): Promise<ScenarioResult> {
    return runScenario(ctx, code);
  }
}
