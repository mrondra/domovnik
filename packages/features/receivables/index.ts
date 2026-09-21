export { ReceivablesModule } from './api/receivables.module';
export {
  ReceivablesService,
  demoReset as resetReceivables,
  findByVariableSymbol,
  generatePrescriptions,
  listDebtors,
  listPrescriptions,
  recordPayment,
  unitBalance,
} from './service/index';

export { paymentRecorded, prescriptionsGenerated } from './domain/events';
export type { Period } from './domain/period';
export type { Prescription, PrescriptionItem, PrescriptionPlan, UnitBalance } from './domain/types';
