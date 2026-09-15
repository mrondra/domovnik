import Link from 'next/link';
import type { ReactElement, ReactNode } from 'react';
import { linkClassName, type LinkStyle } from '../../../../packages/shared/src/ui/typography/index';

export interface AppLinkProps extends LinkStyle {
  readonly href: string;
  readonly children: ReactNode;
}

/**
 * The kit's link styling on the application's router. The kit exports a class name rather than a
 * component because it knows nothing about Next; this is the one place the two are put together.
 */
export const AppLink = ({ href, size, tone, weight, children }: AppLinkProps): ReactElement => (
  <Link href={href} className={linkClassName({ size, tone, weight })}>
    {children}
  </Link>
);
