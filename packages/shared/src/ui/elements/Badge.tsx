import type { ReactElement, ReactNode } from 'react';
import { cx } from '../cx';

export type BadgeTone = 'neutral' | 'pending' | 'positive' | 'negative';

const TONES: Readonly<Record<BadgeTone, string>> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  positive: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  negative: 'bg-red-50 text-red-800 ring-red-200',
};

export interface BadgeProps {
  readonly tone?: BadgeTone;
  readonly children: ReactNode;
}

export const Badge = ({ tone = 'neutral', children }: BadgeProps): ReactElement => (
  <span
    className={cx(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
      TONES[tone],
    )}
  >
    {children}
  </span>
);
