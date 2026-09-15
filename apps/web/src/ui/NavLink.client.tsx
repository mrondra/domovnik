'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactElement } from 'react';
import { navLinkClassName } from '../../../../packages/shared/src/ui/typography/index';

export interface NavLinkProps {
  readonly href: string;
  readonly label: string;
  /**
   * `exact` for the root of a scope (`/`, `/s/<svjId>`), which is a prefix of every other item in
   * it and would otherwise look current on every page.
   */
  readonly match?: 'exact' | 'prefix';
}

/** Client-side only because the highlighted item is the one matching the current path. */
export const NavLink = ({ href, label, match = 'prefix' }: NavLinkProps): ReactElement => {
  const pathname = usePathname();
  const active = pathname === href || (match === 'prefix' && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={navLinkClassName(active ? 'active' : 'idle')}
    >
      {label}
    </Link>
  );
};
