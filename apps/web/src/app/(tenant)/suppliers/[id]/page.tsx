import type { ReactElement } from 'react';
import { SupplierDetailScreen } from '../../../../../../../packages/features/suppliers/ui/index';
import { readSupplierDetail } from '../../../../api/suppliers';

interface PageProps {
  readonly params: Promise<{ readonly id: string }>;
}

const Page = async ({ params }: PageProps): Promise<ReactElement> => {
  const { id } = await params;
  const detail = await readSupplierDetail(id);

  return <SupplierDetailScreen detail={detail} />;
};

export default Page;
