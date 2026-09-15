import type { FieldErrors } from 'react-hook-form';

/** react-hook-form types an error entry as a union of shapes; only a string message is displayable. */
export const messageOf = (errors: FieldErrors, name: string): string | undefined => {
  const entry: unknown = errors[name];
  if (typeof entry !== 'object' || entry === null || !('message' in entry)) return undefined;
  const { message } = entry;
  return typeof message === 'string' ? message : undefined;
};
