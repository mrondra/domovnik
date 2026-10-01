import type { ReactElement } from 'react';
import { Stack } from '../../../shared/src/ui/layout/index';
import { Text } from '../../../shared/src/ui/typography/index';

export interface FactProps {
  readonly label: string;
  readonly value: string;
}

/** A label/value pair — the smallest unit the supplier screens render facts as. */
export const Fact = ({ label, value }: FactProps): ReactElement => (
  <Stack gap="2xs">
    <Text size="xs" tone="subtle" variant="label">
      {label}
    </Text>
    <Text size="sm" tone="default">
      {value}
    </Text>
  </Stack>
);
