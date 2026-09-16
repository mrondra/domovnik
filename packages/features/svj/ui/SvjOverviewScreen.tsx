import Link from 'next/link';
import type { ReactElement } from 'react';
import { Card, EmptyState } from '../../../shared/src/ui/elements/index';
import { Grid, Stack } from '../../../shared/src/ui/layout/index';
import { Heading, Text, linkClassName } from '../../../shared/src/ui/typography/index';
import type { SvjSummaryView } from '../domain/schemas';
import { formatUnitCount } from './labels';

export interface SvjOverviewScreenProps {
  readonly svj: readonly SvjSummaryView[];
  /** Where a card leads. The route prefix belongs to the application, not to the feature. */
  readonly detailHref: (svjId: string) => string;
}

interface SvjCardProps {
  readonly svj: SvjSummaryView;
  readonly href: string;
}

const SvjCard = ({ svj, href }: SvjCardProps): ReactElement => (
  <Card title={svj.name}>
    <Stack gap="xs" align="start">
      <Text size="sm" tone="subtle">
        {formatUnitCount(svj.unitCount)}
      </Text>
      <Link href={href} className={linkClassName({ weight: 'medium' })}>
        Otevřít SVJ
      </Link>
    </Stack>
  </Card>
);

/** The cross-SVJ view: every SVJ the signed-in person may reach, as one card each (task 007 §5). */
export const SvjOverviewScreen = ({ svj, detailHref }: SvjOverviewScreenProps): ReactElement => (
  <Stack gap="lg">
    <Stack gap="2xs">
      <Heading level={1}>SVJ</Heading>
      <Text size="sm" tone="subtle">
        Společenství, která spravujete
      </Text>
    </Stack>
    {svj.length === 0 ? (
      <EmptyState title="Zatím tu není žádné SVJ." />
    ) : (
      <Grid columns={3} gap="md">
        {svj.map((one) => (
          <SvjCard key={one.id} svj={one} href={detailHref(one.id)} />
        ))}
      </Grid>
    )}
  </Stack>
);
