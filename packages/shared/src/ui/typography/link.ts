import { cx } from '../cx';
import { TEXT_TONE, type Tone } from '../tones';
import { TEXT_SIZE, TEXT_WEIGHT, type TextSize, type TextWeight } from './Text';

export interface LinkStyle {
  readonly size?: TextSize | undefined;
  readonly tone?: Tone | undefined;
  readonly weight?: TextWeight | undefined;
}

/**
 * A class name rather than a component, on purpose: routing belongs to the application's router
 * (`next/link` in `apps/web`), the look belongs here. A `Link` component in the kit would have to
 * know about one of the two, and the kit knows nothing (AGENTS.md §2).
 */
export const linkClassName = ({
  size = 'sm',
  tone = 'default',
  weight = 'regular',
}: LinkStyle = {}): string =>
  cx(
    TEXT_SIZE[size],
    TEXT_TONE[tone],
    TEXT_WEIGHT[weight],
    'underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2',
  );

export type NavLinkState = 'active' | 'idle';

const NAV_STATE: Readonly<Record<NavLinkState, string>> = {
  active: 'bg-slate-100 font-medium text-slate-900',
  idle: 'text-slate-600 hover:bg-slate-50',
};

/** The same reasoning as `linkClassName`, for an item in the left-hand navigation. */
export const navLinkClassName = (state: NavLinkState): string =>
  cx('block rounded-md px-3 py-2 text-sm transition-colors', NAV_STATE[state]);
