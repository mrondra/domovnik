import { z } from 'zod';
import {
  svjSchema,
  svjSummarySchema,
  unitSchema,
  type SvjSummaryView,
  type SvjView,
  type UnitView,
} from '../../../../packages/features/svj/ui/index';
import { callApi, readApi } from './client';

export type SvjOption = Pick<SvjSummaryView, 'id' | 'name'>;

const summaryList = z.array(svjSummarySchema);
const unitList = z.array(unitSchema);

/**
 * The list behind the SVJ switcher. It is served by the `svj` feature; in a deployment where that
 * feature is not installed the route does not exist and the tenant has no SVJ — the same answer,
 * so a failed call is an empty list rather than a broken shell.
 */
export const listSvj = async (): Promise<readonly SvjOption[]> => {
  const result = await callApi('/svj', summaryList);
  return result.ok ? result.data : [];
};

/** The feature's screens fetch nothing; the pages read here and hand the data in (task 006 §5). */
export const readSvjSummaries = (): Promise<readonly SvjSummaryView[]> => readApi('/svj', summaryList);

export const readSvj = (svjId: string): Promise<SvjView> => readApi(`/svj/${svjId}`, svjSchema, { svjId });

export const readUnits = (svjId: string): Promise<readonly UnitView[]> =>
  readApi(`/svj/${svjId}/units`, unitList, { svjId });
