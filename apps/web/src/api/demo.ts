import {
  scenarioListView,
  scenarioResultView,
  type ScenarioResultView,
  type ScenarioView,
} from '../../../../packages/features/demo/ui/index';
import { callApi, readApi, type ApiResult } from './client';

/** The feature's screens fetch nothing; the page reads here and hands the data in (task 006 §5). */
export const readScenarios = (): Promise<readonly ScenarioView[]> =>
  readApi('/demo/scenarios', scenarioListView);

export const runScenario = (code: string): Promise<ApiResult<ScenarioResultView>> =>
  callApi(`/demo/scenarios/${encodeURIComponent(code)}/run`, scenarioResultView, {
    method: 'POST',
    body: {},
  });
