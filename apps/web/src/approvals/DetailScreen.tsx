import type { ReactElement } from 'react';
import { decide } from '../actions/approvals';
import { getApproval } from '../api/approvals';
import { ApprovalDetail } from './ApprovalDetail';

export interface DetailScreenProps {
  readonly id: string;
  readonly svjId: string | null;
}

export const DetailScreen = async ({ id, svjId }: DetailScreenProps): Promise<ReactElement> => {
  const approval = await getApproval(id, svjId ?? undefined);
  return <ApprovalDetail approval={approval} onDecide={decide.bind(null, id)} />;
};
