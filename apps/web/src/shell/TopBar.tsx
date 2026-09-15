import type { ReactElement } from 'react';
import { Box, Inline } from '../../../../packages/shared/src/ui/layout/index';
import { Button } from '../../../../packages/shared/src/ui/elements/index';
import { Text } from '../../../../packages/shared/src/ui/typography/index';
import { signOut } from '../actions/auth';
import { canViewAcrossSvj, type Session } from '../api/session';
import type { SvjOption } from '../api/svj';
import { SvjSwitcher } from './SvjSwitcher.client';

export interface TopBarProps {
  readonly session: Session;
  readonly svjId: string | null;
  readonly options: readonly SvjOption[];
}

export const TopBar = ({ session, svjId, options }: TopBarProps): ReactElement => (
  <Box surface="raised" border="bottom" paddingX="lg" paddingY="sm">
    <Inline justify="between" gap="md">
      <SvjSwitcher options={options} svjId={svjId} canViewAcross={canViewAcrossSvj(session)} />
      <Inline gap="md">
        <Text size="sm" tone="subtle">
          {session.roles.join(', ')}
        </Text>
        <form action={signOut}>
          <Button type="submit" variant="ghost">
            Odhlásit
          </Button>
        </form>
      </Inline>
    </Inline>
  </Box>
);
