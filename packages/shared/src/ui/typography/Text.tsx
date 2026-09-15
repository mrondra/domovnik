import type { ReactElement, ReactNode } from 'react';
import { cx } from '../cx';
import { TEXT_TONE, type Tone } from '../tones';

export type TextSize = 'xs' | 'sm' | 'md' | 'lg';
export type TextWeight = 'regular' | 'medium' | 'semibold';
export type TextElement = 'p' | 'span' | 'div' | 'dt' | 'dd' | 'legend';

export const TEXT_SIZE: Readonly<Record<TextSize, string>> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export const TEXT_WEIGHT: Readonly<Record<TextWeight, string>> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
};

export interface TextProps {
  readonly as?: TextElement;
  readonly size?: TextSize;
  readonly tone?: Tone;
  readonly weight?: TextWeight;
  /** Small caps-ish label above a value; the kit's one decorative text treatment. */
  readonly variant?: 'body' | 'label';
  readonly children: ReactNode;
}

const LABEL = 'tracking-wide uppercase';

/** Every run of prose in the application. Size and colour are named roles, never classes. */
export const Text = ({
  as = 'p',
  size = 'sm',
  tone = 'muted',
  weight = 'regular',
  variant = 'body',
  children,
}: TextProps): ReactElement => {
  const Component = as;
  return (
    <Component
      className={cx(TEXT_SIZE[size], TEXT_TONE[tone], TEXT_WEIGHT[weight], variant === 'label' && LABEL)}
    >
      {children}
    </Component>
  );
};
