import Link from 'next/link';
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
} from '../../../shared/src/ui/elements/index';
import { linkClassName } from '../../../shared/src/ui/typography/index';
import { CONFLICT_STATUS_LABEL, FIELD_LABEL, formatMoment, formatValue } from './labels';
import type { ConflictView } from './wire';

export interface ConflictTableProps {
  readonly conflicts: readonly ConflictView[];
  readonly invoiceHref: (invoiceId: string) => string;
}

/**
 * The difference, both sides side by side. Neither is presented as the right one: Pohoda is the
 * source of truth for the books and the platform for the process, and which one wins here is a
 * decision somebody makes (ADR 0005).
 */
export const ConflictTable = ({ conflicts, invoiceHref }: ConflictTableProps): ReactElement =>
  conflicts.length === 0 ? (
    <EmptyState title="S účetnictvím si odpovídáme ve všem." />
  ) : (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Kdy</TableHeaderCell>
          <TableHeaderCell>Čeho se týká</TableHeaderCell>
          <TableHeaderCell>U nás</TableHeaderCell>
          <TableHeaderCell>V Pohodě</TableHeaderCell>
          <TableHeaderCell>Stav</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {conflicts.map((conflict) => (
          <TableRow key={conflict.id}>
            <TableCell>{formatMoment(conflict.createdAt)}</TableCell>
            <TableCell>
              <Link href={invoiceHref(conflict.entityId)} className={linkClassName({ weight: 'medium' })}>
                {FIELD_LABEL[conflict.field] ?? conflict.field}
              </Link>
            </TableCell>
            <TableCell>{formatValue(conflict.ours)}</TableCell>
            <TableCell>{formatValue(conflict.theirs)}</TableCell>
            <TableCell>
              <Badge tone={conflict.status === 'open' ? 'pending' : 'positive'}>
                {CONFLICT_STATUS_LABEL[conflict.status]}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
