import type { ReactElement } from 'react';
import { OverviewScreen } from '../../../overview/OverviewScreen';

interface PageProps {
  readonly params: Promise<{ readonly svjId: string }>;
}

const Page = async ({ params }: PageProps): Promise<ReactElement> => {
  const { svjId } = await params;
  return <OverviewScreen svjId={svjId} />;
};

export default Page;
