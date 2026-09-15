import type { ReactElement, ReactNode } from 'react';

export interface SidebarLayoutProps {
  /** The persistent side column. Hidden below the medium breakpoint, where there is no room. */
  readonly aside: ReactNode;
  readonly children: ReactNode;
}

/**
 * A page with a side column next to a main column that fills the rest. `min-w-0` on the main column
 * is what lets a wide table scroll inside itself instead of stretching the whole page.
 */
export const SidebarLayout = ({ aside, children }: SidebarLayoutProps): ReactElement => (
  <div className="flex min-h-dvh">
    <div className="hidden w-60 shrink-0 md:block">{aside}</div>
    <div className="flex min-w-0 flex-1 flex-col">{children}</div>
  </div>
);
