import type { ReactElement } from 'react';
import { InboxScreen } from '../../../../approvals/InboxScreen';

interface PageProps {
  readonly params: Promise<{ readonly svjId: string }>;
  readonly searchParams: Promise<{ readonly status?: string }>;
}

const Page = async ({ params, searchParams }: PageProps): Promise<ReactElement> => {
  const [{ svjId }, { status }] = await Promise.all([params, searchParams]);
  return <InboxScreen svjId={svjId} status={status} />;
};

export default Page;
