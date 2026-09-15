import type { ReactElement, ReactNode } from 'react';
import { cx } from '../cx';
import { GAP, type Space } from '../space';
import { ALIGN, type Align } from './flex';

export type StackElement = 'div' | 'section' | 'nav' | 'ul' | 'li' | 'main' | 'header' | 'aside' | 'fieldset';

export interface StackProps {
  readonly gap?: Space;
  readonly align?: Align;
  readonly as?: StackElement;
  readonly children: ReactNode;
}

/**
 * Things above each other, separated by a gap. This is the only way vertical rhythm is made: a
 * margin below one element and a padding above the next are two sources for one distance, and the
 * gap belongs to the container that knows how far apart its children stand.
 */
export const Stack = ({ gap = 'md', align = 'stretch', as = 'div', children }: StackProps): ReactElement => {
  const Component = as;
  return <Component className={cx('flex flex-col', GAP[gap], ALIGN[align])}>{children}</Component>;
};
