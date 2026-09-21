'use client';

import { useState, useTransition, type ReactElement } from 'react';
import { Alert, Button } from '../../../shared/src/ui/elements/index';
import { Inline, Stack } from '../../../shared/src/ui/layout/index';
import { Text } from '../../../shared/src/ui/typography/index';
import { BECAUSE_LABEL, formatAmount } from './labels';
import type { CandidateView } from './wire';

export interface ManualMatchProps {
  readonly candidates: readonly CandidateView[];
  readonly onMatch: (candidate: CandidateView) => Promise<string | null>;
}

/**
 * Pairing a movement by hand is choosing from the same list the agent chooses from — there is no
 * free-text target, because a target nobody computed is a target nobody can check (task 023).
 */
export const ManualMatch = ({ candidates, onMatch }: ManualMatchProps): ReactElement => {
  const [failure, setFailure] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  const choose = (candidate: CandidateView): void => {
    startSaving(() => {
      void onMatch(candidate).then(setFailure);
    });
  };

  return (
    <Stack gap="sm">
      {failure === null ? null : (
        <Alert tone="danger" title="Spárovat se nepodařilo">
          <Text size="sm">{failure}</Text>
        </Alert>
      )}

      {candidates.map((candidate) => (
        <Inline key={`${candidate.because}-${candidate.targetId}`} gap="sm" justify="between">
          <Stack gap="2xs">
            <Text size="sm" tone="default">
              {candidate.label}
            </Text>
            <Text size="xs" tone="subtle">
              {BECAUSE_LABEL[candidate.because] ?? candidate.because} · {formatAmount(candidate.amount)}
            </Text>
          </Stack>
          <Button
            variant="secondary"
            disabled={isSaving}
            onClick={() => {
              choose(candidate);
            }}
          >
            Spárovat
          </Button>
        </Inline>
      ))}
    </Stack>
  );
};
