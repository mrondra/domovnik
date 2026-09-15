import { cx } from '../cx';

const BASE = cx(
  'w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900',
  'placeholder:text-slate-400 focus:outline-none',
);

export type ControlState = 'default' | 'invalid';

/** The one look every typed-into or chosen-from control shares. */
export const controlClassName = (state: ControlState = 'default'): string =>
  cx(BASE, state === 'invalid' ? 'border-red-400' : 'border-slate-300 focus:border-slate-500');
