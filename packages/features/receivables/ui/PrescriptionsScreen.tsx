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
import { formatAmount, formatDay, formatMonth } from './labels';
import type { PeriodView, PrescriptionView } from './wire';

export interface PrescriptionsScreenProps {
  readonly prescriptions: readonly PrescriptionView[];
  readonly period: PeriodView;
}

/** What every unit of the house was asked to pay for one month, and what it is made of. */
export const PrescriptionsScreen = ({ prescriptions, period }: PrescriptionsScreenProps): ReactElement => (
  <Stack gap="lg">
    <Stack gap="2xs">
      <Heading level={1}>Předpisy</Heading>
      <Text size="sm" tone="subtle">
        {formatMonth(period)}
      </Text>
    </Stack>

    {prescriptions.length === 0 ? (
      <EmptyState title="Za tento měsíc nejsou vypsané žádné předpisy." />
    ) : (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Variabilní symbol</TableHeaderCell>
            <TableHeaderCell>Splatnost</TableHeaderCell>
            <TableHeaderCell>Položky</TableHeaderCell>
            <TableHeaderCell align="end">Celkem</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {prescriptions.map((one) => (
            <TableRow key={one.id}>
              <TableCell>{one.variableSymbol}</TableCell>
              <TableCell>{formatDay(one.dueDate)}</TableCell>
              <TableCell>{one.items.map((item) => item.label).join(', ')}</TableCell>
              <TableCell align="end">{formatAmount(one.totalAmount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </Stack>
);
