import { z } from 'zod';
import { scenarioResultSchema, scenarioSchema } from '../domain/types';

/** The HTTP contract is the domain shape: one zod schema both validates and documents it. */
export const scenarioListResponse = z.array(scenarioSchema).readonly();
export const scenarioRunResponse = scenarioResultSchema;
