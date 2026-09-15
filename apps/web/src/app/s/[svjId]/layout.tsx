import type { ReactElement, ReactNode } from 'react';
import { AppShell } from '../../../shell/AppShell';

interface LayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{ readonly svjId: string }>;
}

/** The view inside one SVJ. Every request below it carries the SVJ to the API as `x-svj-id`. */
const SvjLayout = async ({ children, params }: LayoutProps): Promise<ReactElement> => {
  const { svjId } = await params;
  return <AppShell svjId={svjId}>{children}</AppShell>;
};

export default SvjLayout;
