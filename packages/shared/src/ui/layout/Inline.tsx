import type { ReactElement, ReactNode } from 'react';
import { cx } from '../cx';
import { GAP, type Space } from '../space';
import { ALIGN, JUSTIFY, type Align, type Justify } from './flex';

export interface InlineProps {
  readonly gap?: Space;
  readonly align?: Align;
  readonly justify?: Justify;
  /** `nowrap` only where the row must stay one line; the default survives a narrow screen. */
  readonly wrap?: 'wrap' | 'nowrap';
  readonly grow?: 'none' | 'children';
  readonly children: ReactNode;
}

/** Things next to each other, separated by a gap. The horizontal counterpart of `Stack`. */
export const Inline = ({
  gap = 'sm',
  align = 'center',
  justify = 'start',
  wrap = 'wrap',
  grow = 'none',
  children,
}: InlineProps): ReactElement => (
  <div
    className={cx(
      'flex',
      GAP[gap],
      ALIGN[align],
      JUSTIFY[justify],
      wrap === 'wrap' ? 'flex-wrap' : 'flex-nowrap',
      grow === 'children' && '*:flex-1',
    )}
  >
    {children}
  </div>
);
