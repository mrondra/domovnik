import type { InferSelectModel } from 'drizzle-orm';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { contractIdSchema, supplierIdSchema } from '../domain/ids';
import { budgetCategorySchema } from '../domain/schemas';
import { specializationSchema } from '../domain/specializations';
import type { Contract, Supplier } from '../domain/types';
import { contract, supplier } from '../schema';

/** Drizzle returns `numeric` as a string, so the column decides the precision, not a float. */
export const asMoney = (value: number): string => value.toFixed(2);

const money = (value: string | null): number | null => (value === null ? null : Number(value));

export const toSupplier = (row: InferSelectModel<typeof supplier>): Supplier => ({
  id: supplierIdSchema.parse(row.id),
  name: row.name,
  ico: row.ico,
  dic: row.dic,
  bankAccount: row.bankAccount,
  email: row.email,
  specializations: row.specializations.map((value) => specializationSchema.parse(value)),
  phone: row.phone,
  contactPerson: row.contactPerson,
  isActive: row.isActive,
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
  covers: row.covers.map((value) => specializationSchema.parse(value)),
});
