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
import { Stack } from '../../../shared/src/ui/layout/index';
import { Heading, Text } from '../../../shared/src/ui/typography/index';
import { formatDebt, formatMonth } from './labels';
import type { UnitBalanceView } from './wire';

export interface DebtorsScreenProps {
  readonly debtors: readonly UnitBalanceView[];
  /** How a unit is named to a person; ids mean nothing to the committee. */
  readonly unitLabel: (unitId: string) => string;
}

/**
 * Who owes and since when. A movement the platform could not place leaves the unit looking like a
 * debtor until somebody decides what the money was for — which is why the oldest unpaid month is
 * shown next to the amount rather than instead of it (task 023).
 */
export const DebtorsScreen = ({ debtors, unitLabel }: DebtorsScreenProps): ReactElement => (
  <Stack gap="lg">
    <Stack gap="2xs">
      <Heading level={1}>Dlužníci</Heading>
      <Text size="sm" tone="subtle">
        Jednotky, které mají nedoplatek
      </Text>
    </Stack>

    {debtors.length === 0 ? (
      <EmptyState title="Nikdo nedluží. Saldo je vyrovnané." />
    ) : (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Jednotka</TableHeaderCell>
            <TableHeaderCell>Nejstarší neuhrazený měsíc</TableHeaderCell>
            <TableHeaderCell align="end">Dluh</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {debtors.map((one) => (
            <TableRow key={one.unitId}>
              <TableCell>{unitLabel(one.unitId)}</TableCell>
              <TableCell>
                {one.oldestUnpaidPeriod === undefined ? '—' : formatMonth(one.oldestUnpaidPeriod)}
              </TableCell>
              <TableCell align="end">{formatDebt(one.balance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </Stack>
);
