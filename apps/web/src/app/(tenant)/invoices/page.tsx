import type { ReactElement } from 'react';
import { InvoiceListScreen } from '../../../../../../packages/features/invoices/ui/index';
import { readInvoices } from '../../../api/invoices';

const Page = async (): Promise<ReactElement> => {
  const invoices = await readInvoices();

  return (
    <InvoiceListScreen
      invoices={invoices}
      title="Faktury"
      description="Přijaté faktury všech SVJ, která spravujete"
      detailHref={(id) => `/invoices/${id}`}
    />
  );
};

export default Page;
