export { PaymentsModule } from './api/payments.module';
export {
  PaymentsService,
  createBankAccount,
  importTransactions,
  listBankAccounts,
  listTransactions,
} from './service/index';

export { paymentMatched, transactionsImported, transactionsUnmatched } from './domain/events';
export { bankTransactionIdSchema } from './domain/ids';
export type { BankAccountId, BankTransactionId } from './domain/ids';
export type { BankAccount, BankTransaction, ImportResult, IncomingTransaction } from './domain/types';
