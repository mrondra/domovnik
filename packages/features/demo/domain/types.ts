import { z } from 'zod';

/** What a scenario does when it is run. One kind per thing the demo can show (task 019). */
export const scenarioKindSchema = z.enum(['inbound_invoice', 'bank_sync', 'pohoda_mutation']);

export type ScenarioKind = z.output<typeof scenarioKindSchema>;

/** An invoice arriving by e-mail: the file is already in storage, the message is made up here. */
export const inboundInvoicePayloadSchema = z.object({
  storageKey: z.string().min(1),
  svjId: z.uuid(),
  from: z.string().min(1),
  subject: z.string().min(1),
});

/** Reading a statement: which account, and how far back. The movements are derived, not stored. */
export const bankSyncPayloadSchema = z.object({
  bankAccountId: z.uuid(),
  svjId: z.uuid(),
  months: z.int().positive(),
});

/** Somebody changing an invoice in Pohoda itself: which house, and by how much (task 025). */
export const pohodaMutationPayloadSchema = z.object({
  svjId: z.uuid(),
  amountChange: z.number(),
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
  outcome: z.enum(['created', 'duplicate', 'imported', 'conflict']),
  message: z.string().min(1),
  /** What the scenario produced, when it produced something a person can go and look at. */
  invoiceId: z.uuid().nullable(),
});

export type ScenarioResult = z.output<typeof scenarioResultSchema>;

/** What a reset threw away, so the person who pressed the button sees that it did something. */
export const resetResultSchema = z.object({ removed: z.int().nonnegative() });

export type ResetResult = z.output<typeof resetResultSchema>;

export interface RegisterScenarioInput {
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly kind: ScenarioKind;
  readonly payload: Readonly<Record<string, unknown>>;
}
