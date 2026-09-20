'use client';

import { useState, useTransition, type ReactElement } from 'react';
import { Alert, Button, Card } from '../../../shared/src/ui/elements/index';
import { Stack } from '../../../shared/src/ui/layout/index';
import { Text } from '../../../shared/src/ui/typography/index';
import type { ScenarioResultView, ScenarioView } from './wire';

export interface ScenarioCardProps {
  readonly scenario: ScenarioView;
  readonly onRun: (code: string) => Promise<ScenarioResultView | string>;
}

/**
 * One scenario and what it did. The result stays on the card rather than navigating away: the
 * point of the button is to watch the platform react, and a page change would hide the reaction.
 */
export const ScenarioCard = ({ scenario, onRun }: ScenarioCardProps): ReactElement => {
  const [result, setResult] = useState<ScenarioResultView | string | null>(null);
  const [isRunning, startRunning] = useTransition();

  const run = (): void => {
    startRunning(() => {
      void onRun(scenario.code).then(setResult);
    });
  };

  return (
    <Card
      title={scenario.title}
      description={scenario.description}
      actions={
        <Button onClick={run} disabled={isRunning}>
          {isRunning ? 'Spouštím…' : 'Spustit'}
        </Button>
      }
    >
      <Stack gap="sm">
        <Text size="xs" tone="subtle">
          {scenario.code}
        </Text>
        {result === null ? null : typeof result === 'string' ? (
          <Alert tone="danger" title="Scénář se nepodařilo spustit">
            <Text size="sm">{result}</Text>
          </Alert>
        ) : (
          <Alert
            tone={result.outcome === 'created' ? 'success' : 'info'}
            title={result.outcome === 'created' ? 'Hotovo' : 'Duplicita'}
          >
            <Text size="sm">{result.message}</Text>
          </Alert>
        )}
      </Stack>
    </Card>
  );
};
