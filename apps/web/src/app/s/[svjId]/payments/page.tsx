import type { ReactElement } from 'react';
import { TransactionListScreen } from '../../../../../../../packages/features/payments/ui/index';
import { readTransactions } from '../../../../api/payments';

type Status = 'all' | 'unmatched' | 'matched' | 'proposed' | 'ignored';

interface PageProps {
  readonly params: Promise<{ readonly svjId: string }>;
  readonly searchParams: Promise<{ readonly status?: string }>;
}

const STATUSES: readonly Status[] = ['all', 'unmatched', 'matched', 'proposed', 'ignored'];

const asStatus = (value: string | undefined): Status => STATUSES.find((one) => one === value) ?? 'all';

const Page = async ({ params, searchParams }: PageProps): Promise<ReactElement> => {
  const [{ svjId }, query] = await Promise.all([params, searchParams]);
  const status = asStatus(query.status);

  return (
    <TransactionListScreen
      transactions={await readTransactions({ svjId, status })}
      status={status}
      detailHref={(id) => `/s/${svjId}/payments/${id}`}
      filterHref={(one) => `/s/${svjId}/payments?status=${one}`}
    />
  );
};

export default Page;
