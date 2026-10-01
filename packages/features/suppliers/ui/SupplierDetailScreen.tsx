import type { ReactElement } from 'react';
import { Badge, Card } from '../../../shared/src/ui/elements/index';
import { Grid, Inline, Stack } from '../../../shared/src/ui/layout/index';
import { Heading, Text } from '../../../shared/src/ui/typography/index';
import { Fact } from './fact';
import { SPECIALIZATION_LABEL } from './labels';
import { SupplierContractsSection } from './SupplierContractsSection';
import type { SupplierDetailView } from './wire';

export interface SupplierDetailScreenProps {
  readonly detail: SupplierDetailView;
}

/**
 * One supplier: what it can do, how to reach it, and — per SVJ, never mixed together — what has
 * been agreed with it. Founding or ending a contract is not here; the screen only shows (task 030).
 */
export const SupplierDetailScreen = ({ detail }: SupplierDetailScreenProps): ReactElement => {
  const { supplier, contractsBySvj } = detail;

  return (
    <Stack gap="lg">
      <Stack gap="2xs">
        <Heading level={1}>{supplier.name}</Heading>
        <Text size="sm" tone="subtle">
          IČO {supplier.ico}
          {supplier.dic === null ? '' : ` · DIČ ${supplier.dic}`}
        </Text>
      </Stack>

      <Card
        title="Obory"
        description="Co dodavatel umí."
        actions={
          <Badge tone={supplier.isActive ? 'positive' : 'neutral'}>
            {supplier.isActive ? 'Aktivní' : 'Neaktivní'}
          </Badge>
        }
      >
        {supplier.specializations.length === 0 ? (
          <Text size="sm" tone="subtle">
            Žádný obor není u dodavatele uveden.
          </Text>
        ) : (
          <Inline gap="2xs">
            {supplier.specializations.map((one) => (
              <Badge key={one}>{SPECIALIZATION_LABEL[one]}</Badge>
            ))}
          </Inline>
        )}
      </Card>

      <Card title="Kontakt" description="Jak se s dodavatelem spojit.">
        <Grid columns={3} gap="md">
          <Fact label="Telefon" value={supplier.phone ?? '—'} />
          <Fact label="Kontaktní osoba" value={supplier.contactPerson ?? '—'} />
          <Fact label="E-mail" value={supplier.email ?? '—'} />
          <Fact label="Bankovní účet" value={supplier.bankAccount ?? '—'} />
        </Grid>
      </Card>

      <SupplierContractsSection contractsBySvj={contractsBySvj} />
    </Stack>
  );
};
