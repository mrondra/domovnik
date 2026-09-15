import type { ReactElement } from 'react';
import { Card } from '../../../../packages/shared/src/ui/elements/index';
import { Grid, Stack } from '../../../../packages/shared/src/ui/layout/index';
import { Heading, Text } from '../../../../packages/shared/src/ui/typography/index';
import { listApprovals } from '../api/approvals';
import { AppLink } from '../ui/AppLink';

export interface OverviewScreenProps {
  readonly svjId: string | null;
}

interface StatProps {
  readonly label: string;
  readonly value: number;
  readonly href: string;
  readonly action: string;
}

const Stat = ({ label, value, href, action }: StatProps): ReactElement => (
  <Card title={label}>
    <Stack gap="xs" align="start">
      <Heading level={2} size={1}>
        {value}
      </Heading>
      <AppLink href={href}>{action}</AppLink>
    </Stack>
  </Card>
);

export const OverviewScreen = async ({ svjId }: OverviewScreenProps): Promise<ReactElement> => {
  const inbox = svjId === null ? '/approvals' : `/s/${svjId}/approvals`;
  const [pending, expired] = await Promise.all([
    listApprovals({ svjId: svjId ?? undefined }),
    listApprovals({ status: 'expired', svjId: svjId ?? undefined }),
  ]);

  return (
    <Stack gap="lg">
      <Stack gap="2xs">
        <Heading level={1}>Přehled</Heading>
        <Text size="sm" tone="subtle">
          {svjId === null ? 'Napříč všemi SVJ' : 'Vybrané SVJ'}
        </Text>
      </Stack>
      <Grid columns={2} gap="md">
        <Stat label="Čeká na rozhodnutí" value={pending.length} href={inbox} action="Otevřít schvalování" />
        <Stat
          label="Propadlo bez rozhodnutí"
          value={expired.length}
          href={`${inbox}?status=expired`}
          action="Zobrazit propadlé"
        />
      </Grid>
    </Stack>
  );
};
