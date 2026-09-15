/** The colour vocabulary. A screen names a role — `muted`, `danger` — never a palette step. */
export type Tone = 'default' | 'muted' | 'subtle' | 'danger' | 'success' | 'inverse';

export const TEXT_TONE: Readonly<Record<Tone, string>> = {
  default: 'text-slate-900',
  muted: 'text-slate-600',
  subtle: 'text-slate-500',
  danger: 'text-red-700',
  success: 'text-emerald-700',
  inverse: 'text-white',
};

/** `raised` is the paper a card is on, `sunken` the well a code block or an empty table sits in. */
export type Surface = 'none' | 'raised' | 'sunken';

export const SURFACE: Readonly<Record<Surface, string>> = {
  none: '',
  raised: 'bg-white',
  sunken: 'bg-slate-50',
};

export type Border = 'none' | 'all' | 'top' | 'bottom' | 'end';

export const BORDER: Readonly<Record<Border, string>> = {
  none: '',
  all: 'border border-slate-200',
  top: 'border-t border-slate-200',
  bottom: 'border-b border-slate-200',
  end: 'border-e border-slate-200',
};

export type Radius = 'none' | 'sm' | 'md' | 'lg' | 'full';

export const RADIUS: Readonly<Record<Radius, string>> = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};
