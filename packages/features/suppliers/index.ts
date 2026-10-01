import './registry.generated';
export { SuppliersModule } from './api/suppliers.module';
export {
  SuppliersService,
  contractById,
  contractedSupplierFor,
  createContract,
  createSupplier,
  findContractsForSupplier,
  findSupplierByIco,
  listContracts,
  listSuppliers,
  searchSuppliers,
  supplierById,
  updateSupplier,
} from './service/index';
export type {
  ContractedSupplier,
  ContractedSupplierForInput,
  SearchSuppliersInput,
  UpdateSupplierInput,
} from './service/index';

export { contractSchema, supplierSchema } from './domain/schemas';
export { contractIdSchema, supplierIdSchema } from './domain/ids';
export type { ContractId, SupplierId } from './domain/ids';
export type { BudgetCategory, Contract, Supplier } from './domain/types';
