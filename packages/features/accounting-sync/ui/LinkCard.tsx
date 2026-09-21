import type { ReactElement } from 'react';
import { Badge, Card } from '../../../shared/src/ui/elements/index';
import { Inline, Stack } from '../../../shared/src/ui/layout/index';
import { Heading, Text } from '../../../shared/src/ui/typography/index';
import type { AccountingStatusView } from './wire';
import { formatMoment } from './labels';

const ADAPTER_LABEL: Readonly<Record<string, string>> = {
  mock: 'Demo Pohoda',
  mserver: 'Pohoda mServer',
  internal: 'Předpisy v Domovníkovi',
  pohoda_other_receivables: 'Ostatní pohledávky v Pohodě',
};

export interface LinkCardProps {
  readonly link: AccountingStatusView['link'];
}

/** Where this house is booked. A house nobody linked says so instead of showing an empty table. */
export const LinkCard = ({ link }: LinkCardProps): ReactElement => (
  <Card>
    {link === null ? (
      <Stack gap="2xs">
        <Heading level={2}>Bez napojení</Heading>
        <Text size="sm" tone="subtle">
          Tomuto SVJ zatím nikdo nenastavil účetní jednotku, takže se do účetnictví nic nezapisuje.
        </Text>
      </Stack>
    ) : (
      <Stack gap="xs">
        <Inline gap="sm">
          <Heading level={2}>Účetní jednotka {link.companyIco}</Heading>
          <Badge tone="neutral">{ADAPTER_LABEL[link.accountingAdapter] ?? link.accountingAdapter}</Badge>
        </Inline>
        <Text size="sm" tone="subtle">
          Pohledávky: {ADAPTER_LABEL[link.receivablesAdapter] ?? link.receivablesAdapter}. Naposledy
          porovnáno: {formatMoment(link.lastSyncAt)}.
        </Text>
      </Stack>
    )}
  </Card>
);
