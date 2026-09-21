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
  type BadgeTone,
} from '../../../shared/src/ui/elements/index';
import { JOB_KIND_LABEL, JOB_STATUS_LABEL, formatMoment } from './labels';
import type { SyncJobView } from './wire';

const TONE: Readonly<Record<SyncJobView['status'], BadgeTone>> = {
  pending: 'pending',
  running: 'pending',
  done: 'positive',
  failed: 'negative',
};

export interface JobTableProps {
  readonly jobs: readonly SyncJobView[];
}

/** What was last said to the accounting, and what it answered. A failure shows its reason. */
export const JobTable = ({ jobs }: JobTableProps): ReactElement =>
  jobs.length === 0 ? (
    <EmptyState title="S účetnictvím si tenhle dům zatím nic nevyměnil." />
  ) : (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Kdy</TableHeaderCell>
          <TableHeaderCell>Co</TableHeaderCell>
          <TableHeaderCell>Stav</TableHeaderCell>
          <TableHeaderCell>Poznámka</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id}>
            <TableCell>{formatMoment(job.createdAt)}</TableCell>
            <TableCell>{JOB_KIND_LABEL[job.kind]}</TableCell>
            <TableCell>
              <Badge tone={TONE[job.status]}>{JOB_STATUS_LABEL[job.status]}</Badge>
            </TableCell>
            <TableCell>{job.error ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
