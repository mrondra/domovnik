/** Joins the class names that survive a conditional, so a component can compose them inline. */
export const cx = (...values: readonly (string | false | null | undefined)[]): string =>
  values.filter((value): value is string => typeof value === 'string' && value !== '').join(' ');
