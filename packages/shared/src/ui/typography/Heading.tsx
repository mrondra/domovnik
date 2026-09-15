import type { ReactElement, ReactNode } from 'react';
import { cx } from '../cx';
import { TEXT_TONE, type Tone } from '../tones';

export type HeadingLevel = 1 | 2 | 3;

const TAGS = { 1: 'h1', 2: 'h2', 3: 'h3' } as const;

/** The default size per level. `size` overrides it where the hierarchy and the look differ. */
const SIZES: Readonly<Record<HeadingLevel, string>> = {
  1: 'text-xl font-semibold tracking-tight',
  2: 'text-base font-medium',
  3: 'text-sm font-medium',
};

export interface HeadingProps {
  readonly level: HeadingLevel;
  readonly size?: HeadingLevel;
  readonly tone?: Tone;
  readonly children: ReactNode;
}

export const Heading = ({ level, size, tone = 'default', children }: HeadingProps): ReactElement => {
  const Component = TAGS[level];
  return <Component className={cx(SIZES[size ?? level], TEXT_TONE[tone])}>{children}</Component>;
};
