import type { ReactElement } from 'react';
import { DetailScreen } from '../../../../approvals/DetailScreen';

interface PageProps {
  readonly params: Promise<{ readonly id: string }>;
}

const Page = async ({ params }: PageProps): Promise<ReactElement> => {
  const { id } = await params;
  return <DetailScreen id={id} svjId={null} />;
};

export default Page;
