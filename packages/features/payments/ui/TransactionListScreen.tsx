import Link from 'next/link';
import type { ReactElement } from 'react';
import {
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../../../shared/src/ui/elements/index';
import { Inline, Stack } from '../../../shared/src/ui/layout/index';
import { Heading, Text, linkClassName, navLinkClassName } from '../../../shared/src/ui/typography/index';
import type { MatchStatus } from '../domain/types';
import { MatchStatusBadge } from './MatchStatusBadge';
import { directionOf, formatAmount, formatDay, MATCH_STATUS_LABEL } from './labels';
import type { TransactionView } from './wire';

const FILTERS: readonly (MatchStatus | 'all')[] = ['all', 'unmatched', 'proposed', 'matched', 'ignored'];

export interface TransactionListScreenProps {
  readonly transactions: readonly TransactionView[];
  readonly status: MatchStatus | 'all';
  readonly detailHref: (transactionId: string) => string;
  readonly filterHref: (status: MatchStatus | 'all') => string;
}

export const TransactionListScreen = ({
  transactions,
  status,
  detailHref,
  filterHref,
}: TransactionListScreenProps): ReactElement => (
  <Stack gap="lg">
    <Stack gap="2xs">
      <Heading level={1}>Platby</Heading>
      <Text size="sm" tone="subtle">
        Pohyby na účtu SVJ a to, čeho se týkají
      </Text>
    </Stack>

    <Inline gap="sm">
      {FILTERS.map((one) => (
        <Link
          key={one}
          href={filterHref(one)}
          className={navLinkClassName(one === status ? 'active' : 'idle')}
        >
          {one === 'all' ? 'Vše' : MATCH_STATUS_LABEL[one]}
        </Link>
      ))}
    </Inline>

    {transactions.length === 0 ? (
      <EmptyState title="Pro tento filtr tu není žádný pohyb." />
    ) : (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Datum</TableHeaderCell>
            <TableHeaderCell>Protistrana</TableHeaderCell>
            <TableHeaderCell>VS</TableHeaderCell>
            <TableHeaderCell>Stav</TableHeaderCell>
            <TableHeaderCell align="end">Částka</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((one) => (
            <TableRow key={one.id}>
              <TableCell>
                <Link href={detailHref(one.id)} className={linkClassName({ weight: 'medium' })}>
                  {formatDay(one.bookedOn)}
                </Link>
              </TableCell>
              <TableCell>{one.counterpartyName ?? directionOf(one.amount)}</TableCell>
              <TableCell>{one.variableSymbol ?? '—'}</TableCell>
              <TableCell>
                <MatchStatusBadge status={one.matchStatus} />
              </TableCell>
              <TableCell align="end">{formatAmount(one.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </Stack>
);
