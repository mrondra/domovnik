import type { ReactElement } from 'react';
import { Card, EmptyState } from '../../../shared/src/ui/elements/index';
import { Grid, Stack } from '../../../shared/src/ui/layout/index';
import { Text } from '../../../shared/src/ui/typography/index';
import type { BudgetCategory } from '../domain/types';
import { Fact } from './fact';
import { SPECIALIZATION_LABEL } from './labels';
import type { SvjContractsView } from './wire';

/**
 * `budgetCategory` already has Czech labels in `invoices/ui/labels.ts`, but `labels.ts` here
 * belongs to task 030 subtask 1 (`.task/plan.md`) — a second copy, not an import across features.
 */
const BUDGET_CATEGORY_LABEL: Readonly<Record<BudgetCategory, string>> = {
  uklid: 'Úklid',
  vytah: 'Výtah',
  energie: 'Energie',
  opravy: 'Opravy',
  revize: 'Revize',
  sprava: 'Správa',
  pojisteni: 'Pojištění',
  ostatni: 'Ostatní',
};

const DAY = new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium' });

const formatDay = (value: string | null): string =>
  value === null ? 'bez konce' : DAY.format(new Date(`${value}T00:00:00.000Z`));

export interface SupplierContractsSectionProps {
  readonly contractsBySvj: readonly SvjContractsView[];
}

/** Per-SVJ contracts with one supplier, each SVJ's own group never mixed with another's. */
export const SupplierContractsSection = ({ contractsBySvj }: SupplierContractsSectionProps): ReactElement => (
  <Card title="Smlouvy" description="Co s dodavatelem má sjednáno každé SVJ, každé zvlášť.">
    {contractsBySvj.length === 0 ? (
      <EmptyState title="Žádné SVJ v dosahu nemá s tímto dodavatelem smlouvu." />
    ) : (
      <Stack gap="md">
        {contractsBySvj.map((group) => (
          <Stack key={group.svjId} gap="sm">
            <Text size="sm" weight="medium">
              {group.svjName}
            </Text>
            {group.contracts.map((contract) => (
              <Grid key={contract.id} columns={4} gap="md">
                <Fact label="Předmět" value={contract.subject} />
                <Fact label="Rozpočtová kategorie" value={BUDGET_CATEGORY_LABEL[contract.budgetCategory]} />
                <Fact
                  label="Platnost"
                  value={`${formatDay(contract.validFrom)} – ${formatDay(contract.validTo)}`}
                />
                <Fact
                  label="Pokrývá"
                  value={
                    contract.covers.length === 0
                      ? '—'
                      : contract.covers.map((one) => SPECIALIZATION_LABEL[one]).join(', ')
                  }
                />
              </Grid>
            ))}
          </Stack>
        ))}
      </Stack>
    )}
  </Card>
);
