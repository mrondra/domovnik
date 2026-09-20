import type { ReactElement } from 'react';
import { InvoiceDetailScreen } from '../../../../../../../../packages/features/invoices/ui/index';
import { readInvoice } from '../../../../../api/invoices';
import { traceHref } from '../../../../../approvals/trace';

interface PageProps {
  readonly params: Promise<{ readonly svjId: string; readonly id: string }>;
}

const Page = async ({ params }: PageProps): Promise<ReactElement> => {
  const { svjId, id } = await params;
  const detail = await readInvoice(id, svjId);

  return (
    <InvoiceDetailScreen
      detail={detail}
      approvalHref={(approvalId) => `/s/${svjId}/approvals/${approvalId}`}
      traceHref={traceHref()}
    />
  );
};

export default Page;
