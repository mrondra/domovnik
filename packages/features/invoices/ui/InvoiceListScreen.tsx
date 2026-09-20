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
import { Stack } from '../../../shared/src/ui/layout/index';
import { Heading, Text, linkClassName } from '../../../shared/src/ui/typography/index';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { formatAmount, formatDay } from './labels';
import type { InvoiceView } from './wire';

export interface InvoiceListScreenProps {
  readonly invoices: readonly InvoiceView[];
  readonly title: string;
  readonly description: string;
  /** Where a row leads. The route prefix belongs to the application, not to the feature. */
  readonly detailHref: (invoiceId: string) => string;
}

export const InvoiceListScreen = ({
  invoices,
  title,
  description,
  detailHref,
}: InvoiceListScreenProps): ReactElement => (
  <Stack gap="lg">
    <Stack gap="2xs">
      <Heading level={1}>{title}</Heading>
      <Text size="sm" tone="subtle">
        {description}
      </Text>
    </Stack>

    {invoices.length === 0 ? (
      <EmptyState title="Zatím tu není žádná faktura." />
    ) : (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Číslo</TableHeaderCell>
            <TableHeaderCell>Stav</TableHeaderCell>
            <TableHeaderCell>Splatnost</TableHeaderCell>
            <TableHeaderCell align="end">Částka</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <Link href={detailHref(invoice.id)} className={linkClassName({ weight: 'medium' })}>
                  {invoice.externalNumber ?? 'Bez čísla'}
                </Link>
              </TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
              <TableCell>{formatDay(invoice.dueOn)}</TableCell>
              <TableCell align="end">{formatAmount(invoice.amountTotal, invoice.currency)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </Stack>
);
