import type { ReactElement } from 'react';
import { Box, Divider, Stack } from '../../../../packages/shared/src/ui/layout/index';
import { Heading } from '../../../../packages/shared/src/ui/typography/index';
import type { Session } from '../api/session';
import { hrefOf, navigationFor } from '../navigation/items';
import { NavLink } from '../ui/NavLink.client';

export interface SidebarProps {
  readonly session: Session;
  readonly svjId: string | null;
}

export const Sidebar = ({ session, svjId }: SidebarProps): ReactElement => (
  <Box surface="raised" border="end" paddingX="md" paddingY="lg" height="full">
    <Stack gap="lg">
      <Box paddingX="sm">
        <Heading level={1}>Domovník</Heading>
      </Box>
      <Divider />
      <Stack gap="2xs" as="nav">
        {navigationFor(session, svjId).map((item) => (
          <NavLink
            key={item.href}
            href={hrefOf(item, svjId)}
            label={item.label}
            match={item.href === '' ? 'exact' : 'prefix'}
          />
        ))}
      </Stack>
    </Stack>
  </Box>
);
