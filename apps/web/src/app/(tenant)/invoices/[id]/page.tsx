import type { ReactElement } from 'react';
import { InvoiceDetailScreen } from '../../../../../../../packages/features/invoices/ui/index';
import { readInvoice } from '../../../../api/invoices';
import { traceHref } from '../../../../approvals/trace';

interface PageProps {
  readonly params: Promise<{ readonly id: string }>;
}

const Page = async ({ params }: PageProps): Promise<ReactElement> => {
  const { id } = await params;
  const detail = await readInvoice(id);

  return (
    <InvoiceDetailScreen
      detail={detail}
      approvalHref={(approvalId) => `/approvals/${approvalId}`}
      traceHref={traceHref()}
    />
  );
};

export default Page;
