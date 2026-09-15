import type { ReactElement, ReactNode } from 'react';
import { cx } from '../cx';
import { PADDING, PADDING_X, PADDING_Y, type Space } from '../space';
import { BORDER, RADIUS, SURFACE, type Border, type Radius, type Surface } from '../tones';

export interface BoxProps {
  /** Inset on every side. `paddingX`/`paddingY` win over it where both are given. */
  readonly padding?: Space;
  readonly paddingX?: Space;
  readonly paddingY?: Space;
  readonly surface?: Surface;
  readonly border?: Border;
  readonly radius?: Radius;
  readonly overflow?: 'visible' | 'hidden' | 'scroll-x';
  readonly height?: 'auto' | 'full';
  readonly children: ReactNode;
}

const OVERFLOW: Readonly<Record<NonNullable<BoxProps['overflow']>, string>> = {
  visible: '',
  hidden: 'overflow-hidden',
  'scroll-x': 'overflow-x-auto',
};

/**
 * The one element that owns an inset, a background and a border. Everything else composes it, so a
 * screen never reaches for a padding class of its own.
 */
export const Box = ({
  padding = 'none',
  paddingX,
  paddingY,
  surface = 'none',
  border = 'none',
  radius = 'none',
  overflow = 'visible',
  height = 'auto',
  children,
}: BoxProps): ReactElement => (
  <div
    className={cx(
      paddingX === undefined && paddingY === undefined ? PADDING[padding] : '',
      paddingX === undefined ? '' : PADDING_X[paddingX],
      paddingY === undefined ? '' : PADDING_Y[paddingY],
      SURFACE[surface],
      BORDER[border],
      RADIUS[radius],
      OVERFLOW[overflow],
      height === 'full' && 'h-full',
    )}
  >
    {children}
  </div>
);
