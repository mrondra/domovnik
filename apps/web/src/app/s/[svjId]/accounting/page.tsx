import type { ReactElement } from 'react';
import { AccountingStatusScreen } from '../../../../../../../packages/features/accounting-sync/ui/index';
import { readAccountingStatus } from '../../../../api/accounting';

interface PageProps {
  readonly params: Promise<{ readonly svjId: string }>;
}

const Page = async ({ params }: PageProps): Promise<ReactElement> => {
  const { svjId } = await params;

  return (
    <AccountingStatusScreen
      status={await readAccountingStatus(svjId)}
      invoiceHref={(invoiceId) => `/s/${svjId}/invoices/${invoiceId}`}
    />
  );
};

export default Page;
