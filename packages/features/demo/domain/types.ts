import { z } from 'zod';

/** What a scenario does when it is run. One kind per thing the demo can show (task 019). */
export const scenarioKindSchema = z.enum(['inbound_invoice']);

export type ScenarioKind = z.output<typeof scenarioKindSchema>;

/** An invoice arriving by e-mail: the file is already in storage, the message is made up here. */
export const inboundInvoicePayloadSchema = z.object({
  storageKey: z.string().min(1),
  svjId: z.uuid(),
  from: z.string().min(1),
  subject: z.string().min(1),
});

export const scenarioSchema = z.object({
  id: z.uuid(),
  code: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  kind: scenarioKindSchema,
});

export type Scenario = z.output<typeof scenarioSchema>;

export const scenarioResultSchema = z.object({
  code: z.string().min(1),
  outcome: z.enum(['created', 'duplicate']),
  message: z.string().min(1),
  /** What the scenario produced, when it produced something a person can go and look at. */
  invoiceId: z.uuid().nullable(),
});

export type ScenarioResult = z.output<typeof scenarioResultSchema>;

export interface RegisterScenarioInput {
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly kind: ScenarioKind;
  readonly payload: Readonly<Record<string, unknown>>;
}
