import type { ReactElement } from 'react';
import { DebtorsScreen } from '../../../../../../../../packages/features/receivables/ui/index';
import { readDebtors } from '../../../../../api/receivables';
import { readUnits } from '../../../../../api/svj';

interface PageProps {
  readonly params: Promise<{ readonly svjId: string }>;
}

const Page = async ({ params }: PageProps): Promise<ReactElement> => {
  const { svjId } = await params;
  const [debtors, units] = await Promise.all([readDebtors(svjId), readUnits(svjId)]);
  const numbers = new Map(units.map((one) => [one.id, one.number]));

  return (
    <DebtorsScreen
      debtors={debtors}
      unitLabel={(unitId) => `Jednotka ${numbers.get(unitId) ?? unitId.slice(0, 8)}`}
    />
  );
};

export default Page;
