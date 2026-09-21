export { AccountingSyncModule } from './api/accounting-sync.module';
export { AccountingSyncService, linkOf, linkSvj, requireLink } from './service/index';
export { accountingAdapterFor } from './adapters/index';

export type { AccountingAdapter } from './adapters/index';
export type {
  AccountingInvoice,
  AccountingLink,
  BankStatementLine,
  LiquidateInput,
  PostInvoiceInput,
} from './domain/types';
