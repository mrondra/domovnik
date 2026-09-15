import type { ReactElement } from 'react';
import {
  Badge,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../../../../packages/shared/src/ui/elements/index';
import type { ApprovalSummary } from '../api/approvals';
import { AppLink } from '../ui/AppLink';
import { statusLabel } from './decision';
import { toneOf } from './tone';

export interface ApprovalTableProps {
  readonly approvals: readonly ApprovalSummary[];
  /** `/approvals` or `/s/<svjId>/approvals`; the row links into it. */
  readonly basePath: string;
}

const moment = new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium', timeStyle: 'short' });

export const ApprovalTable = ({ approvals, basePath }: ApprovalTableProps): ReactElement => {
  if (approvals.length === 0) return <EmptyState title="Nic nečeká na rozhodnutí." />;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Akce</TableHeaderCell>
          <TableHeaderCell>Vzniklo</TableHeaderCell>
          <TableHeaderCell>Termín</TableHeaderCell>
          <TableHeaderCell align="end">Stav</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {approvals.map((approval) => (
          <TableRow key={approval.id}>
            <TableCell>
              <AppLink href={`${basePath}/${approval.id}`} weight="medium">
                {approval.toolName}
              </AppLink>
            </TableCell>
            <TableCell>{moment.format(new Date(approval.createdAt))}</TableCell>
            <TableCell>
              {approval.deadline === null ? '—' : moment.format(new Date(approval.deadline))}
            </TableCell>
            <TableCell align="end">
              <Badge tone={toneOf(approval.status)}>{statusLabel(approval.status)}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
