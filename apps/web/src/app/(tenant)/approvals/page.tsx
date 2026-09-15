import type { ReactElement } from 'react';
import { InboxScreen } from '../../../approvals/InboxScreen';

interface PageProps {
  readonly searchParams: Promise<{ readonly status?: string }>;
}

const Page = async ({ searchParams }: PageProps): Promise<ReactElement> => {
  const { status } = await searchParams;
  return <InboxScreen svjId={null} status={status} />;
};

export default Page;
