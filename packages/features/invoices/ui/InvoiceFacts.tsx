import type { ReactElement } from 'react';
import { Grid, Stack } from '../../../shared/src/ui/layout/index';
import { Text } from '../../../shared/src/ui/typography/index';
import { BUDGET_CATEGORY_LABEL, formatAmount, formatDay } from './labels';
import type { InvoiceDetailView } from './wire';

interface FactProps {
  readonly label: string;
  readonly value: string;
}

const Fact = ({ label, value }: FactProps): ReactElement => (
  <Stack gap="2xs">
    <Text size="xs" tone="subtle" variant="label">
      {label}
    </Text>
    <Text size="sm" tone="default">
      {value}
    </Text>
  </Stack>
);

export interface InvoiceFactsProps {
  readonly detail: InvoiceDetailView;
}

/** The numbers, as they were read off the invoice — never recomputed here (task 016). */
export const InvoiceFacts = ({ detail }: InvoiceFactsProps): ReactElement => {
  const { invoice, supplier, contract, budget } = detail;

  return (
    <Grid columns={3} gap="md">
      <Fact label="Dodavatel" value={supplier?.name ?? 'Neurčený'} />
      <Fact label="IČO" value={supplier?.ico ?? '—'} />
      <Fact label="Částka" value={formatAmount(invoice.amountTotal, invoice.currency)} />
      <Fact label="Z toho DPH" value={formatAmount(invoice.amountVat, invoice.currency)} />
      <Fact label="Vystaveno" value={formatDay(invoice.issuedOn)} />
      <Fact label="Splatnost" value={formatDay(invoice.dueOn)} />
      <Fact label="Variabilní symbol" value={invoice.variableSymbol ?? '—'} />
      <Fact label="Smlouva" value={contract?.subject ?? 'Bez smlouvy'} />
      <Fact
        label="Rozpočet"
        value={
          budget === null
            ? '—'
            : `${BUDGET_CATEGORY_LABEL[budget.category]}: zbývá ${formatAmount(budget.remaining)}`
        }
      />
    </Grid>
  );
};
