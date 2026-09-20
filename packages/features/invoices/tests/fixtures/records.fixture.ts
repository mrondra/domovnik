import { newId, svjIdSchema } from '../../../../kernel/src/ids/index';
import { contractIdSchema, supplierIdSchema } from '../../domain/ids';
import type { Contract, Supplier } from '../../domain/types';

/** Domain records built rather than cast, so a change to the shape breaks the test that uses it. */
export const aSupplier = (overrides: Partial<Supplier> = {}): Supplier => ({
  id: newId(supplierIdSchema),
  name: 'Úklid Praha s.r.o.',
  ico: '27000111',
  dic: 'CZ27000111',
  bankAccount: '2801234567/2010',
  email: null,
  ...overrides,
});

export const aContract = (overrides: Partial<Contract> = {}): Contract => ({
  id: newId(contractIdSchema),
  svjId: newId(svjIdSchema),
  supplierId: newId(supplierIdSchema),
  subject: 'Úklid společných prostor',
  budgetCategory: 'uklid',
  monthlyAmount: 15_000,
  validFrom: '2026-01-01',
  validTo: null,
  documentId: null,
  ...overrides,
});
