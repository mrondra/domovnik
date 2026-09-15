import type { ReactElement, ReactNode } from 'react';
import { cx } from '../cx';

export interface CenterProps {
  /** `screen` centres within the viewport — the login screen; `none` within whatever room there is. */
  readonly minHeight?: 'screen' | 'none';
  readonly children: ReactNode;
}

export const Center = ({ minHeight = 'none', children }: CenterProps): ReactElement => (
  <div className={cx('flex flex-col justify-center', minHeight === 'screen' && 'min-h-dvh')}>{children}</div>
);
