import type { ReactElement } from 'react';
import { Card } from '../../../shared/src/ui/elements/index';
import { Grid, Stack } from '../../../shared/src/ui/layout/index';
import { Heading, Text } from '../../../shared/src/ui/typography/index';
import type { SvjView, UnitView } from '../domain/schemas';
import { formatUnitCount } from './labels';
import { UnitTable } from './UnitTable';

export interface SvjDetailScreenProps {
  readonly svj: SvjView;
  readonly units: readonly UnitView[];
}

interface FactProps {
  readonly label: string;
  readonly value: string;
}

const Fact = ({ label, value }: FactProps): ReactElement => (
  <Stack gap="2xs" align="start">
    <Text size="xs" tone="muted" variant="label">
      {label}
    </Text>
    <Text size="sm">{value}</Text>
  </Stack>
);

const NOT_FILLED = '—';

const joined = (values: readonly string[]): string => (values.length === 0 ? NOT_FILLED : values.join(', '));

export const SvjDetailScreen = ({ svj, units }: SvjDetailScreenProps): ReactElement => (
  <Stack gap="lg">
    <Stack gap="2xs">
      <Heading level={1}>{svj.name}</Heading>
      <Text size="sm" tone="subtle">
        {formatUnitCount(units.length)}
      </Text>
    </Stack>

    <Card title="Základní údaje">
      <Grid columns={2} gap="md">
        <Fact label="IČO" value={svj.ico} />
        <Fact label="Adresa" value={`${svj.address.street}, ${svj.address.postalCode} ${svj.address.city}`} />
        <Fact label="Bankovní účty" value={joined(svj.bankAccounts)} />
        <Fact label="Členů výboru" value={String(svj.committee.length)} />
      </Grid>
    </Card>

    <Card title="Jednotky" body="flush">
      <UnitTable units={units} />
    </Card>
  </Stack>
);
