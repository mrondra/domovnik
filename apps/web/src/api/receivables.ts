import {
  prescriptionListView,
  unitBalanceListView,
  type PrescriptionView,
  type UnitBalanceView,
} from '../../../../packages/features/receivables/ui/index';
import { readApi } from './client';

export interface PeriodQuery {
  readonly svjId: string;
  readonly year: number;
  readonly month: number;
}

export const readPrescriptions = (query: PeriodQuery): Promise<readonly PrescriptionView[]> =>
  readApi(
    `/svj/${query.svjId}/prescriptions?year=${String(query.year)}&month=${String(query.month)}`,
    prescriptionListView,
    { svjId: query.svjId },
  );

export const readDebtors = (svjId: string, minDebt = 1): Promise<readonly UnitBalanceView[]> =>
  readApi(`/svj/${svjId}/debtors?minDebt=${String(minDebt)}`, unitBalanceListView, { svjId });
