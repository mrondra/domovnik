import type { ReactElement, ReactNode } from 'react';
import { cx } from '../cx';
import { GAP, type Space } from '../space';

export type GridColumns = 1 | 2 | 3 | 4;

/** One column until there is room; the declared count from the medium breakpoint up. */
const COLUMNS: Readonly<Record<GridColumns, string>> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4',
};

export interface GridProps {
  readonly columns?: GridColumns;
  readonly gap?: Space;
  readonly children: ReactNode;
}

export const Grid = ({ columns = 2, gap = 'md', children }: GridProps): ReactElement => (
  <div className={cx('grid', COLUMNS[columns], GAP[gap])}>{children}</div>
);
