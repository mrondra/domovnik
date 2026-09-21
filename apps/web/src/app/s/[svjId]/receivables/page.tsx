import type { ReactElement } from 'react';
import { PrescriptionsScreen } from '../../../../../../../packages/features/receivables/ui/index';
import { readPrescriptions } from '../../../../api/receivables';

interface PageProps {
  readonly params: Promise<{ readonly svjId: string }>;
  readonly searchParams: Promise<{ readonly year?: string; readonly month?: string }>;
}

/** The month somebody is looking at, defaulting to the one they are standing in. */
const periodOf = (query: { year?: string; month?: string }): { year: number; month: number } => {
  const today = new Date();
  const year = Number(query.year ?? today.getUTCFullYear());
  const month = Number(query.month ?? today.getUTCMonth() + 1);
  return Number.isInteger(year) && Number.isInteger(month)
    ? { year, month }
    : { year: today.getUTCFullYear(), month: today.getUTCMonth() + 1 };
};

const Page = async ({ params, searchParams }: PageProps): Promise<ReactElement> => {
  const [{ svjId }, query] = await Promise.all([params, searchParams]);
  const period = periodOf(query);

  return (
    <PrescriptionsScreen prescriptions={await readPrescriptions({ svjId, ...period })} period={period} />
  );
};

export default Page;
