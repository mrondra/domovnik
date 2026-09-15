import type { ReactElement, ReactNode } from 'react';
import { Box, Inline, Stack } from '../layout/index';
import { Heading, Text } from '../typography/index';

export interface CardProps {
  readonly title?: string;
  readonly description?: string;
  readonly actions?: ReactNode;
  /** `flush` hands the inset to the content — a table draws its own, edge to edge. */
  readonly body?: 'padded' | 'flush';
  readonly children: ReactNode;
}

interface HeaderProps {
  readonly title: string;
  readonly description: string | undefined;
  readonly actions: ReactNode;
}

const Header = ({ title, description, actions }: HeaderProps): ReactElement => (
  <Box paddingX="lg" paddingY="md" border="bottom">
    <Inline justify="between" align="start" gap="md">
      <Stack gap="2xs">
        <Heading level={2}>{title}</Heading>
        {description === undefined ? null : (
          <Text size="sm" tone="subtle">
            {description}
          </Text>
        )}
      </Stack>
      {actions}
    </Inline>
  </Box>
);

/** A titled panel. The only element that draws paper under content. */
export const Card = ({ title, description, actions, body = 'padded', children }: CardProps): ReactElement => (
  <Box surface="raised" border="all" radius="lg" overflow="hidden">
    {title === undefined ? null : <Header title={title} description={description} actions={actions} />}
    {body === 'padded' ? (
      <Box paddingX="lg" paddingY="md">
        {children}
      </Box>
    ) : (
      children
    )}
  </Box>
);
