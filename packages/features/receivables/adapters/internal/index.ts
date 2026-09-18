import { listDebtors, unitBalance } from './balance';
import { generatePrescriptions } from './generate';
import { recordPayment } from './payments';
import { findByVariableSymbol, listPrescriptions } from './prescriptions';
import type { GeneratingReceivablesAdapter } from '../receivables.adapter';

export const internalReceivablesAdapter: GeneratingReceivablesAdapter = {
  kind: 'internal',
  listPrescriptions,
  findByVariableSymbol,
  unitBalance,
  listDebtors,
  recordPayment,
  generatePrescriptions,
};
