import type { ReactElement, ReactNode } from 'react';
import { Box, Stack } from '../layout/index';
import { Text } from '../typography/index';

export interface EmptyStateProps {
  readonly title: string;
  readonly children?: ReactNode;
}

/** What a list says when it has nothing to say. Never an empty area with no explanation. */
export const EmptyState = ({ title, children }: EmptyStateProps): ReactElement => (
  <Box paddingY="lg" paddingX="md">
    <Stack gap="2xs" align="center">
      <Text size="sm" tone="muted">
        {title}
      </Text>
      {children}
    </Stack>
  </Box>
);
