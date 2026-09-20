import { z } from 'zod';

const line = z.object({
  description: z.string(),
  quantity: z.number().nullable(),
  unitPrice: z.number().nullable(),
  amount: z.number(),
});

/**
 * What a Czech invoice says, as the model is asked to read it. Everything that may genuinely be
 * absent is nullable rather than optional: a model that may omit a key omits it when it is unsure,
 * and an explicit `null` is an answer we can check, where a missing key is a shrug.
 */
export const extractedInvoiceSchema = z.object({
  supplierName: z.string(),
  supplierIco: z.string(),
  supplierDic: z.string().nullable(),
  externalNumber: z.string(),
  variableSymbol: z.string().nullable(),
  issuedOn: z.string(),
  dueOn: z.string(),
  amountTotal: z.number(),
  amountVat: z.number().nullable(),
  currency: z.string(),
  bankAccount: z.string().nullable(),
  lines: z.array(line),
});

export type ExtractedInvoice = z.output<typeof extractedInvoiceSchema>;
