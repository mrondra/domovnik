import type { ReactElement } from 'react';
import { SvjDetailScreen } from '../../../../../../../packages/features/svj/ui/index';
import { readSvj, readUnits } from '../../../../api/svj';

interface PageProps {
  readonly params: Promise<{ readonly svjId: string }>;
}

const Page = async ({ params }: PageProps): Promise<ReactElement> => {
  const { svjId } = await params;
  const [svj, units] = await Promise.all([readSvj(svjId), readUnits(svjId)]);
  return <SvjDetailScreen svj={svj} units={units} />;
};

export default Page;
