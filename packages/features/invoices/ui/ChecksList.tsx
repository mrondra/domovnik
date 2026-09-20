import type { ReactElement } from 'react';
import { Badge, EmptyState, type BadgeTone } from '../../../shared/src/ui/elements/index';
import { Inline, Stack } from '../../../shared/src/ui/layout/index';
import { Text } from '../../../shared/src/ui/typography/index';
import type { Check, CheckSeverity } from '../domain/checks';
import { checkLabel } from './labels';

const TONE: Readonly<Record<CheckSeverity, BadgeTone>> = {
  blocking: 'negative',
  warning: 'pending',
  info: 'neutral',
};

export interface ChecksListProps {
  readonly checks: readonly Check[];
}

/**
 * What the deterministic rules found, in the order they were raised. The code stays next to the
 * label: it is what an agent matched on and what a person will quote when they ask about it.
 */
export const ChecksList = ({ checks }: ChecksListProps): ReactElement => {
  if (checks.length === 0) {
    return <EmptyState title="Kontroly neměly k faktuře žádnou výhradu." />;
  }

  return (
    <Stack gap="sm">
      {checks.map((check) => (
        <Stack key={check.code} gap="2xs">
          <Inline gap="xs" align="center">
            <Badge tone={TONE[check.severity]}>{checkLabel(check.code)}</Badge>
            <Text size="xs" tone="subtle">
              {check.code}
            </Text>
          </Inline>
          <Text size="sm">{check.message}</Text>
        </Stack>
      ))}
    </Stack>
  );
};
