import { z } from 'zod';

/** Any non-empty string: a feature registers a kind of its own instead of `demo` naming it (task 028). */
export const scenarioKindSchema = z.string().min(1);

export const scenarioSchema = z.object({
  id: z.uuid(),
  code: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  kind: scenarioKindSchema,
});

export type Scenario = z.output<typeof scenarioSchema>;

/** Where a person can go and look at what a scenario produced, when it produced anything at all. */
export const scenarioLinkSchema = z.object({ label: z.string().min(1), path: z.string().min(1) }).nullable();

export const scenarioResultSchema = z.object({
  code: z.string().min(1),
  outcome: z.string().min(1),
  message: z.string().min(1),
  link: scenarioLinkSchema,
});

export type ScenarioResult = z.output<typeof scenarioResultSchema>;

/** What a reset threw away, so the person who pressed the button sees that it did something. */
export const resetResultSchema = z.object({ removed: z.int().nonnegative() });

export type ResetResult = z.output<typeof resetResultSchema>;

export interface RegisterScenarioInput {
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly kind: string;
  readonly payload: Readonly<Record<string, unknown>>;
}
