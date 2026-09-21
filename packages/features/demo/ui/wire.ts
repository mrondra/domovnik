import { z } from 'zod';
import { resetResultSchema, scenarioResultSchema, scenarioSchema } from '../domain/types';

/** What the browser side of this feature sees; the screens fetch nothing themselves (ADR 0017). */
export const scenarioListView = z.array(scenarioSchema);
export const scenarioResultView = scenarioResultSchema;
export const resetResultView = resetResultSchema;

export type ScenarioView = z.output<typeof scenarioSchema>;
export type ScenarioResultView = z.output<typeof scenarioResultSchema>;
export type ResetResultView = z.output<typeof resetResultSchema>;
