import type { InferSelectModel } from 'drizzle-orm';
import { agentRunIdSchema, approvalIdSchema, svjIdSchema } from '../../../kernel/src/ids/index';
import { contractIdSchema, invoiceIdSchema, supplierIdSchema } from '../domain/ids';
import { budgetCategorySchema, invoiceStatusSchema } from '../domain/schemas';
import type { Contract, Invoice, Supplier } from '../domain/types';
import { contract, invoice, supplier } from '../schema/index';

/** Drizzle returns `numeric` as a string, so the column decides the precision, not a float. */
export const asMoney = (value: number): string => value.toFixed(2);

const money = (value: string | null): number | null => (value === null ? null : Number(value));

/** The branded ids are rebuilt here, once, and a null column stays null all the way through. */
const branded = <T>(schema: { parse(value: unknown): T }, value: string | null): T | null =>
  value === null ? null : schema.parse(value);

export const toSupplier = (row: InferSelectModel<typeof supplier>): Supplier => ({
  id: supplierIdSchema.parse(row.id),
  name: row.name,
  ico: row.ico,
  dic: row.dic,
  bankAccount: row.bankAccount,
  email: row.email,
});

export const toContract = (row: InferSelectModel<typeof contract>): Contract => ({
  id: contractIdSchema.parse(row.id),
  svjId: svjIdSchema.parse(row.svjId),
  supplierId: supplierIdSchema.parse(row.supplierId),
  subject: row.subject,
  budgetCategory: budgetCategorySchema.parse(row.budgetCategory),
  monthlyAmount: money(row.monthlyAmount),
  validFrom: row.validFrom,
  validTo: row.validTo,
  documentId: row.documentId,
});

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
