/**
 * How the units of one house behave. The demo needs a statement that is mostly boring and
 * interesting in exactly the places the platform is meant to help with (zadání kap. 10), and it
 * needs to behave the same way every time it is generated.
 */
export interface PayerProfile {
  /** Units at these positions never pay. They are the debtors the dunning agent is for. */
  readonly silent: readonly number[];
  /** Units at these positions pay with two digits of the variable symbol swapped. */
  readonly mistyped: readonly number[];
  /** A unit that pays every other month, twice the amount, settling two months at once. */
  readonly joint: number | null;
  /** A unit that pays this much less than it was asked for. */
  readonly short: { readonly at: number; readonly by: number } | null;
}

const EXACT: PayerProfile = { silent: [], mistyped: [], joint: null, short: null };

/**
 * One profile per house, by the order the houses were taken on. The first pays like a textbook,
 * the second is where the residual comes from, the third pays a little short.
 */
export const PROFILES: readonly PayerProfile[] = [
  EXACT,
  { silent: [0, 1, 2], mistyped: [3, 4], joint: 5, short: null },
  { ...EXACT, short: { at: 0, by: 200 } },
];

export const profileFor = (sequence: number): PayerProfile => PROFILES[sequence - 1] ?? EXACT;

const swapLastTwo = (variableSymbol: string): string => {
  const digits = Array.from(variableSymbol);
  const [last, beforeLast] = [digits.at(-1), digits.at(-2)];
  if (last === undefined || beforeLast === undefined) return variableSymbol;

  digits[digits.length - 1] = beforeLast;
  digits[digits.length - 2] = last;
  return digits.join('');
};

/**
 * Two digits swapped is what a person does, and seeing through it is what the agent is for. In a
 * house of eighty, though, a swap can land on somebody else's real symbol — and then the money is
 * quietly credited to the wrong unit and nobody is ever asked about it, which is the one outcome a
 * demonstration must not produce. So a swap that collides drops a digit instead: still a typo,
 * still nobody's symbol (task 021).
 */
export const mistype = (variableSymbol: string, taken: ReadonlySet<string> = new Set()): string => {
  if (variableSymbol.length < 2) return variableSymbol;

  const swapped = swapLastTwo(variableSymbol);
  if (swapped !== variableSymbol && !taken.has(swapped)) return swapped;

  return variableSymbol.slice(0, -1);
};
