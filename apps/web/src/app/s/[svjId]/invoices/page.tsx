import type { ReactElement } from 'react';
import { InvoiceListScreen } from '../../../../../../../packages/features/invoices/ui/index';
import { readInvoices } from '../../../../api/invoices';

interface PageProps {
  readonly params: Promise<{ readonly svjId: string }>;
}

const Page = async ({ params }: PageProps): Promise<ReactElement> => {
  const { svjId } = await params;
  const invoices = await readInvoices({ svjId });

  return (
    <InvoiceListScreen
      invoices={invoices}
      title="Faktury"
      description="Přijaté faktury tohoto SVJ"
      detailHref={(id) => `/s/${svjId}/invoices/${id}`}
    />
  );
};

export default Page;
