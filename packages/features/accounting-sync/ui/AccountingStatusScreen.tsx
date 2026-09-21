import type { ReactElement } from 'react';
import { Stack } from '../../../shared/src/ui/layout/index';
import { Heading, Text } from '../../../shared/src/ui/typography/index';
import { ConflictTable } from './ConflictTable';
import { JobTable } from './JobTable';
import { LinkCard } from './LinkCard';
import type { AccountingStatusView } from './wire';

export interface AccountingStatusScreenProps {
  readonly status: AccountingStatusView;
  readonly invoiceHref: (invoiceId: string) => string;
}

/**
 * How this house stands with the accounting: where it is booked, what has been said to Pohoda, and
 * what the two sides do not agree about (task 025).
 */
export const AccountingStatusScreen = ({
  status,
  invoiceHref,
}: AccountingStatusScreenProps): ReactElement => (
  <Stack gap="lg">
    <Stack gap="2xs">
      <Heading level={1}>Účetnictví</Heading>
      <Text size="sm" tone="subtle">
        Pohoda je zdroj pravdy pro účetnictví. Domovník do ní zapisuje schválené faktury a úhrady a čte
        zpátky, co v ní je — rozdíl nikdy nepřepisuje, ale ukáže.
      </Text>
    </Stack>

    <LinkCard link={status.link} />

    <Stack gap="xs">
      <Heading level={2}>Rozdíly</Heading>
      <ConflictTable conflicts={status.conflicts} invoiceHref={invoiceHref} />
    </Stack>

    <Stack gap="xs">
      <Heading level={2}>Poslední výměny</Heading>
      <JobTable jobs={status.jobs} />
    </Stack>
  </Stack>
);
