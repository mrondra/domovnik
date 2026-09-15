import type { ButtonHTMLAttributes, ReactElement } from 'react';
import { cx } from '../cx';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const BASE = cx(
  'inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium',
  'transition-colors disabled:pointer-events-none disabled:opacity-50',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500',
);

const VARIANTS: Readonly<Record<ButtonVariant, string>> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
  danger: 'border border-red-300 bg-white text-red-700 hover:bg-red-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
};

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  readonly variant?: ButtonVariant;
  readonly width?: 'auto' | 'full';
}

/** `type` defaults to `button`: a button inside a form submits it unless it says otherwise. */
export const Button = ({
  variant = 'secondary',
  width = 'auto',
  type = 'button',
  ...rest
}: ButtonProps): ReactElement => (
  <button type={type} className={cx(BASE, VARIANTS[variant], width === 'full' && 'w-full')} {...rest} />
);
