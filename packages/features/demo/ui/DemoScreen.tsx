import type { ReactElement } from 'react';
import { EmptyState } from '../../../shared/src/ui/elements/index';
import { Stack } from '../../../shared/src/ui/layout/index';
import { Heading, Text } from '../../../shared/src/ui/typography/index';
import { ScenarioCard } from './ScenarioCard.client';
import type { ScenarioResultView, ScenarioView } from './wire';

export interface DemoScreenProps {
  readonly scenarios: readonly ScenarioView[];
  readonly onRun: (code: string) => Promise<ScenarioResultView | string>;
}

/** What the platform can be made to do on purpose, and what each of those is meant to show. */
export const DemoScreen = ({ scenarios, onRun }: DemoScreenProps): ReactElement => (
  <Stack gap="lg">
    <Stack gap="2xs">
      <Heading level={1}>Demo</Heading>
      <Text size="sm" tone="subtle">
        Každý scénář udělá totéž co skutečný provoz — jen ho spustíte vy.
      </Text>
    </Stack>

    {scenarios.length === 0 ? (
      <EmptyState title="Seed zatím nepřipravil žádný scénář." />
    ) : (
      <Stack gap="md">
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.code} scenario={scenario} onRun={onRun} />
        ))}
      </Stack>
    )}
  </Stack>
);
