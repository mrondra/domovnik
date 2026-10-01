import type { ReactElement } from 'react';
import {
  specializationSchema,
  SupplierListScreen,
  type Specialization,
} from '../../../../../../packages/features/suppliers/ui/index';
import { readSuppliers } from '../../../api/suppliers';

type SpecializationOrAll = Specialization | 'all';

interface PageProps {
  readonly searchParams: Promise<{ readonly specialization?: string }>;
}

const asSpecialization = (value: string | undefined): SpecializationOrAll => {
  const parsed = specializationSchema.safeParse(value);
  return parsed.success ? parsed.data : 'all';
};

const Page = async ({ searchParams }: PageProps): Promise<ReactElement> => {
  const query = await searchParams;
  const specialization = asSpecialization(query.specialization);

  return (
    <SupplierListScreen
      suppliers={await readSuppliers(specialization === 'all' ? {} : { specialization })}
      specialization={specialization}
      detailHref={(id) => `/suppliers/${id}`}
      filterHref={(one) => (one === 'all' ? '/suppliers' : `/suppliers?specialization=${one}`)}
    />
  );
};

export default Page;
