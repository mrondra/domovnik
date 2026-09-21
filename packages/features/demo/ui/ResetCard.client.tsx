'use client';

import { useState, useTransition, type ReactElement } from 'react';
import { Alert, Button, Card } from '../../../shared/src/ui/elements/index';
import { Stack } from '../../../shared/src/ui/layout/index';
import { Text } from '../../../shared/src/ui/typography/index';
import type { ResetResultView } from './wire';

export interface ResetCardProps {
  readonly onReset: () => Promise<ResetResultView | string>;
}

const DESCRIPTION =
  'Smaže všechno, co vzniklo během ukázky — faktury, výpisy, úhrady, schvalování, běhy agentů ' +
  'a to, co ví demo Pohoda. Domy, jednotky, předpisy, dodavatele, smlouvy, rozpočty a účty ' +
  'nechává být: ty demo nevyrobilo.';

/** Starting over before the next demonstration, with a plain sentence about what that throws away. */
export const ResetCard = ({ onReset }: ResetCardProps): ReactElement => {
  const [result, setResult] = useState<ResetResultView | string | null>(null);
  const [isRunning, startRunning] = useTransition();

  const reset = (): void => {
    startRunning(() => {
      void onReset().then(setResult);
    });
  };

  return (
    <Card
      title="Začít znovu"
      description={DESCRIPTION}
      actions={
        <Button variant="secondary" onClick={reset} disabled={isRunning}>
          {isRunning ? 'Mažu…' : 'Resetovat demo'}
        </Button>
      }
    >
      <Stack gap="sm">
        {result === null ? null : typeof result === 'string' ? (
          <Alert tone="danger" title="Reset se nepodařil">
            <Text size="sm">{result}</Text>
          </Alert>
        ) : (
          <Alert tone="success" title="Hotovo">
            <Text size="sm">Smazáno {result.removed} záznamů. Demo je zpátky na začátku.</Text>
          </Alert>
        )}
      </Stack>
    </Card>
  );
};
