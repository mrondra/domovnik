import type { ReactElement } from 'react';
import { DetailScreen } from '../../../../../approvals/DetailScreen';

interface PageProps {
  readonly params: Promise<{ readonly svjId: string; readonly id: string }>;
}

const Page = async ({ params }: PageProps): Promise<ReactElement> => {
  const { svjId, id } = await params;
  return <DetailScreen id={id} svjId={svjId} />;
};

export default Page;
