export { AccountingSyncModule } from './api/accounting-sync.module';
export {
  AccountingSyncService,
  accountingStatus,
  detectConflicts,
  fetchStatements,
  getConflict,
  linkOf,
  linkSvj,
  listConflicts,
  recordStatements,
  requireLink,
  resolveConflict,
} from './service/index';
export { accountingAdapterFor, pohodaMock } from './adapters/index';
export { syncConflictDetected } from './domain/events';
export { syncConflictIdSchema } from './domain/ids';

export type { SyncConflictId } from './domain/ids';
export type { AccountingAdapter } from './adapters/index';
export type { SyncConflict, SyncJob } from './domain/sync';
export type {
  AccountingInvoice,
  AccountingLink,
  BankStatementLine,
  LiquidateInput,
  PostInvoiceInput,
} from './domain/types';
