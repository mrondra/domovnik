import {
  accountingStatusView,
  type AccountingStatusView,
} from '../../../../packages/features/accounting-sync/ui/index';
import { readApi } from './client';

/** The feature's screens fetch nothing; the pages read here and hand the data in (task 006 §5). */
export const readAccountingStatus = (svjId: string): Promise<AccountingStatusView> =>
  readApi(`/svj/${svjId}/accounting`, accountingStatusView, { svjId });
