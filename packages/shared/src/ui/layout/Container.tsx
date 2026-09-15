import type { ReactElement, ReactNode } from 'react';
import { cx } from '../cx';
import { PADDING_X, PADDING_Y, type Space } from '../space';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'full';

const WIDTH: Readonly<Record<ContainerSize, string>> = {
  sm: 'max-w-sm',
  md: 'max-w-2xl',
  lg: 'max-w-5xl',
  full: 'max-w-none',
};

export type ContainerElement = 'div' | 'main' | 'section';

export interface ContainerProps {
  readonly as?: ContainerElement;
  readonly size?: ContainerSize;
  /** The gutter that keeps content off the edge of a phone. */
  readonly gutter?: Space;
  readonly paddingY?: Space;
  readonly children: ReactNode;
}

/** Centres a column of content and holds the only horizontal gutter on the page. */
export const Container = ({
  as = 'div',
  size = 'lg',
  gutter = 'lg',
  paddingY = 'none',
  children,
}: ContainerProps): ReactElement => {
  const Component = as;
  return (
    <Component className={cx('mx-auto w-full', WIDTH[size], PADDING_X[gutter], PADDING_Y[paddingY])}>
      {children}
    </Component>
  );
};
