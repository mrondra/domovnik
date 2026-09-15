import { z } from 'zod';
import { callApi } from './client';

export const svjOptionSchema = z.object({ id: z.uuid(), name: z.string() });

export type SvjOption = z.output<typeof svjOptionSchema>;

/**
 * The list behind the SVJ switcher. It is served by the `svj` feature; in a deployment where that
 * feature is not installed the route does not exist and the tenant has no SVJ — the same answer,
 * so a failed call is an empty list rather than a broken shell.
 */
export const listSvj = async (): Promise<readonly SvjOption[]> => {
  const result = await callApi('/svj', z.array(svjOptionSchema));
  return result.ok ? result.data : [];
};
