import { z } from 'zod';

export type CheckSeverity = 'info' | 'warning' | 'blocking';

/**
 * What the deterministic rules made of an extracted invoice. `blocking` is what stops it: a person
 * has to look. `warning` is what the agent writes its summary from (task 017); `info` is context.
 * The list is kept on the invoice, so a decision taken months ago can still be explained.
 */
export interface Check {
  readonly code: string;
  readonly severity: CheckSeverity;
  readonly message: string;
  readonly data?: unknown;
}

export const checkSchema = z.object({
  code: z.string().min(1),
  severity: z.enum(['info', 'warning', 'blocking']),
  message: z.string().min(1),
  data: z.unknown().optional(),
});

/** What `invoice.checks` holds: the provenance of the message, and the rules that then ran. */
export const invoiceChecksSchema = z.object({
  mail: z.looseObject({}).optional(),
  results: z.array(checkSchema).readonly().optional(),
});

export const codesOfSeverity = (checks: unknown, severity: CheckSeverity): readonly string[] => {
  const parsed = invoiceChecksSchema.safeParse(checks);
  if (!parsed.success) return [];
  return (parsed.data.results ?? [])
    .filter((check) => check.severity === severity)
    .map((check) => check.code);
};

export const CHECK_LABEL: Readonly<Record<string, string>> = {
  supplier_unknown: 'Neznámý dodavatel',
  contract_missing: 'Chybí smlouva',
  amount_deviates: 'Jiná částka než ve smlouvě',
  budget_exceeded: 'Překročený rozpočet',
  duplicate_number: 'Faktura už je založená',
  due_soon: 'Blíží se splatnost',
  vs_missing: 'Chybí variabilní symbol',
  pdf_no_text: 'Nečitelné PDF',
};

/** A code nobody has written a label for is still better shown than hidden. */
export const checkLabel = (code: string): string => CHECK_LABEL[code] ?? code;
