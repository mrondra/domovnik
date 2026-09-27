import type { InferSelectModel } from 'drizzle-orm';
import { agentRunIdSchema, approvalIdSchema, svjIdSchema } from '../../../kernel/src/ids/index';
import { contractIdSchema, supplierIdSchema } from '../../suppliers/index';
import { invoiceIdSchema } from '../domain/ids';
import { budgetCategorySchema, invoiceStatusSchema } from '../domain/schemas';
import type { Invoice } from '../domain/types';
import { invoice } from '../schema/index';

/** Drizzle returns `numeric` as a string, so the column decides the precision, not a float. */
export const asMoney = (value: number): string => value.toFixed(2);

const money = (value: string | null): number | null => (value === null ? null : Number(value));

/** The branded ids are rebuilt here, once, and a null column stays null all the way through. */
const branded = <T>(schema: { parse(value: unknown): T }, value: string | null): T | null =>
  value === null ? null : schema.parse(value);

export const toInvoice = (row: InferSelectModel<typeof invoice>): Invoice => ({
  id: invoiceIdSchema.parse(row.id),
  svjId: svjIdSchema.parse(row.svjId),
  status: invoiceStatusSchema.parse(row.status),
  supplierId: branded(supplierIdSchema, row.supplierId),
  contractId: branded(contractIdSchema, row.contractId),
  documentId: row.documentId,
  externalNumber: row.externalNumber,
  variableSymbol: row.variableSymbol,
  issuedOn: row.issuedOn,
  dueOn: row.dueOn,
  amountTotal: money(row.amountTotal),
  amountVat: money(row.amountVat),
  currency: row.currency,
  budgetCategory: branded(budgetCategorySchema, row.budgetCategory),
  extraction: row.extraction,
  checks: row.checks,
  agentRunId: branded(agentRunIdSchema, row.agentRunId),
  approvalId: branded(approvalIdSchema, row.approvalId),
  accountingRef: row.accountingRef,
  receivedAt: row.receivedAt.toISOString(),
  source: row.source,
});
