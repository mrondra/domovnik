import type { ReactElement } from 'react';
import { Box, Stack } from '../../../../packages/shared/src/ui/layout/index';
import { Code, Text } from '../../../../packages/shared/src/ui/typography/index';

export interface EvidenceProps {
  readonly label: string;
  readonly value: unknown;
}

/**
 * What the agent saw, shown as it was recorded. Until a tool ships a presentation of its own, the
 * raw record is more honest than a rendering that quietly leaves fields out.
 */
export const Evidence = ({ label, value }: EvidenceProps): ReactElement => (
  <Stack gap="2xs">
    <Text size="xs" tone="subtle" variant="label">
      {label}
    </Text>
    <Box surface="sunken" radius="md" padding="sm" overflow="scroll-x">
      <Code display="block">
        {value === null || value === undefined ? '—' : JSON.stringify(value, null, 2)}
      </Code>
    </Box>
  </Stack>
);
