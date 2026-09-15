import type { ReactElement, ReactNode } from 'react';
import { cx } from '../cx';
import { TEXT_TONE, type Tone } from '../tones';

export interface CodeProps {
  readonly tone?: Tone;
  /** `block` keeps the line breaks of a recorded payload; `inline` is a value inside a sentence. */
  readonly display?: 'inline' | 'block';
  readonly children: ReactNode;
}

export const Code = ({ tone = 'muted', display = 'inline', children }: CodeProps): ReactElement => {
  const className = cx('font-mono text-xs', TEXT_TONE[tone]);

  if (display === 'inline') return <code className={cx(className, 'break-all')}>{children}</code>;
  return <pre className={className}>{children}</pre>;
};
