/**
 * The one spacing scale. Everything that separates things — a gap, an inset — names a step on it,
 * never a raw number, so the same distance means the same thing on every screen.
 *
 * The maps are written out in full because Tailwind reads class names from the source: a class
 * assembled at run time (`gap-${n}`) is a class Tailwind never generates.
 */
export type Space = 'none' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export const GAP: Readonly<Record<Space, string>> = {
  none: 'gap-0',
  '2xs': 'gap-1',
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
  '2xl': 'gap-12',
  '3xl': 'gap-16',
};

export const PADDING: Readonly<Record<Space, string>> = {
  none: 'p-0',
  '2xs': 'p-1',
  xs: 'p-2',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
  '2xl': 'p-12',
  '3xl': 'p-16',
};

export const PADDING_X: Readonly<Record<Space, string>> = {
  none: 'px-0',
  '2xs': 'px-1',
  xs: 'px-2',
  sm: 'px-3',
  md: 'px-4',
  lg: 'px-6',
  xl: 'px-8',
  '2xl': 'px-12',
  '3xl': 'px-16',
};

export const PADDING_Y: Readonly<Record<Space, string>> = {
  none: 'py-0',
  '2xs': 'py-1',
  xs: 'py-2',
  sm: 'py-3',
  md: 'py-4',
  lg: 'py-6',
  xl: 'py-8',
  '2xl': 'py-12',
  '3xl': 'py-16',
};
