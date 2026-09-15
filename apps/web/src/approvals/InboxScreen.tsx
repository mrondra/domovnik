import type { ReactElement } from 'react';
import { Card } from '../../../../packages/shared/src/ui/elements/index';
import { approvalStatusSchema, listApprovals, type ApprovalStatus } from '../api/approvals';
import { ApprovalTable } from './ApprovalTable';
import { StatusTabs } from './StatusTabs';

export interface InboxScreenProps {
  readonly svjId: string | null;
  /** Straight from the query string, so it is parsed rather than trusted. */
  readonly status: string | undefined;
}

const statusOf = (raw: string | undefined): ApprovalStatus =>
  approvalStatusSchema.safeParse(raw).data ?? 'pending';

export const InboxScreen = async ({ svjId, status }: InboxScreenProps): Promise<ReactElement> => {
  const active = statusOf(status);
  const basePath = svjId === null ? '/approvals' : `/s/${svjId}/approvals`;
  const approvals = await listApprovals({ status: active, svjId: svjId ?? undefined });

  return (
    <Card
      title="Schvalování"
      description="Akce, které agenti připravili a čekají na rozhodnutí člověka."
      actions={<StatusTabs basePath={basePath} active={active} />}
      body="flush"
    >
      <ApprovalTable approvals={approvals} basePath={basePath} />
    </Card>
  );
};
