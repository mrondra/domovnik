import type { ReactElement, ReactNode } from 'react';
import { Container, SidebarLayout } from '../../../../packages/shared/src/ui/layout/index';
import { requireSession } from '../api/session';
import { listSvj } from '../api/svj';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export interface AppShellProps {
  /** `null` is the cross-SVJ view; a value is the SVJ from the `/s/[svjId]` URL prefix. */
  readonly svjId: string | null;
  readonly children: ReactNode;
}

/**
 * Every signed-in screen renders inside this. The session is resolved once, here, so a page below
 * can assume it exists; an anonymous visitor is redirected to the login screen instead.
 */
export const AppShell = async ({ svjId, children }: AppShellProps): Promise<ReactElement> => {
  const session = await requireSession();
  const options = await listSvj();

  return (
    <SidebarLayout aside={<Sidebar session={session} svjId={svjId} />}>
      <TopBar session={session} svjId={svjId} options={options} />
      <Container as="main" size="lg" gutter="lg" paddingY="xl">
        {children}
      </Container>
    </SidebarLayout>
  );
};
