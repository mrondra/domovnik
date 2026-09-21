/**
 * How many single-key slips turn one symbol into the other, counting a swapped pair of adjacent
 * digits as one — because that is one slip of the fingers, and it is the mistake people actually
 * make with a variable symbol. Plain Levenshtein calls a transposition two edits, which would put
 * the very case this exists for out of reach (task 022).
 *
 * The walk stops as soon as everything in flight is already past the limit, so a symbol that is
 * nothing like the other is rejected without being measured.
 */
export const typoDistanceWithin = (left: string, right: string, limit: number): number | null => {
  if (Math.abs(left.length - right.length) > limit) return null;

  const rows: number[][] = [Array.from({ length: right.length + 1 }, (_unused, at) => at)];

  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];

    for (let column = 1; column <= right.length; column += 1) {
      const same = left[row - 1] === right[column - 1];
      const previous = rows[row - 1] ?? [];
      const substitution = (previous[column - 1] ?? 0) + (same ? 0 : 1);
      const deletion = (previous[column] ?? 0) + 1;
      const insertion = (current[column - 1] ?? 0) + 1;
      let best = Math.min(substitution, deletion, insertion);

      const swapped =
        row > 1 && column > 1 && left[row - 1] === right[column - 2] && left[row - 2] === right[column - 1];
      if (swapped) best = Math.min(best, (rows[row - 2]?.[column - 2] ?? 0) + 1);

      current.push(best);
    }

    if (Math.min(...current) > limit) return null;
    rows.push(current);
  }

  const distance = rows[left.length]?.[right.length] ?? limit + 1;
  return distance > limit ? null : distance;
};
