import { z } from 'zod';
import { checkSchema } from '../domain/checks';
import { approveInputSchema } from '../domain/proposal';
import { budgetCategorySchema, budgetStatusSchema, invoiceSchema } from '../domain/schemas';

/**
 * What the browser side of this feature sees. It is the same zod the API answers with — the screens
 * fetch nothing themselves (ADR 0017), so this is what `apps/web` parses before handing it in.
 *
 * `supplierView`/`contractView` are defined here rather than imported from `suppliers`: that
 * feature's public door also exports its Nest module, which the Next.js build cannot compile
 * (ADR 0017) — a UI-only door for a feature with no screens of its own is not worth the split.
 */
export const supplierView = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  ico: z.string().min(1),
  dic: z.string().nullable(),
  bankAccount: z.string().nullable(),
  email: z.string().nullable(),
});

export const contractView = z.object({
  id: z.uuid(),
  svjId: z.uuid(),
  supplierId: z.uuid(),
  subject: z.string().min(1),
  budgetCategory: budgetCategorySchema,
  monthlyAmount: z.number().nullable(),
  validFrom: z.iso.date(),
  validTo: z.iso.date().nullable(),
  documentId: z.uuid().nullable(),
});

export const agentRunView = z.object({
  id: z.uuid(),
  status: z.string().min(1),
  traceId: z.string().nullable(),
  model: z.string().nullable(),
  inputTokens: z.int().nonnegative(),
  outputTokens: z.int().nonnegative(),
});

export const proposalView = approveInputSchema
  .omit({ invoiceId: true })
  .extend({ id: z.uuid(), status: z.string().min(1) });

export const invoiceDetailView = z.object({
  invoice: invoiceSchema,
  extraction: z.unknown(),
  checks: z.unknown(),
  supplier: supplierView.nullable(),
  contract: contractView.nullable(),
  budget: budgetStatusSchema.nullable(),
  agentRun: agentRunView.nullable(),
  approval: proposalView.nullable(),
  downloadUrl: z.url().nullable(),
});

export const invoiceListView = z.array(invoiceSchema);

/** `invoice.checks` also holds the provenance of the message; only the rules are shown as rules. */
export const checkResultsOf = (checks: unknown): readonly z.output<typeof checkSchema>[] => {
  const parsed = z.object({ results: z.array(checkSchema).optional() }).safeParse(checks);
  return parsed.success ? (parsed.data.results ?? []) : [];
};

export const reviewNoteOf = (
  checks: unknown,
): { readonly note: string; readonly missing: readonly string[] } | null => {
  const parsed = z
    .object({ reviewNote: z.object({ note: z.string(), missing: z.array(z.string()) }) })
    .safeParse(checks);
  return parsed.success ? parsed.data.reviewNote : null;
};

export type InvoiceView = z.output<typeof invoiceSchema>;
export type InvoiceDetailView = z.output<typeof invoiceDetailView>;
