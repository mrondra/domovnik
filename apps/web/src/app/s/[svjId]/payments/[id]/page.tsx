import type { ReactElement } from 'react';
import {
  TransactionDetailScreen,
  type CandidateView,
} from '../../../../../../../../packages/features/payments/ui/index';
import { match } from '../../../../../actions/payments';
import { readTransaction } from '../../../../../api/payments';
import { getSession } from '../../../../../api/session';

interface PageProps {
  readonly params: Promise<{ readonly svjId: string; readonly id: string }>;
}

const MAY_PAIR = ['tenant_admin', 'manager', 'finance'];

/**
 * Somebody who may read the statement but not decide about it gets the screen without the buttons.
 * The API refuses them too — this is so they are not offered something that will be refused.
 */
const Page = async ({ params }: PageProps): Promise<ReactElement> => {
  const { svjId, id } = await params;
  const [detail, session] = await Promise.all([readTransaction(id, svjId), getSession()]);
  const mayPair = session?.roles.some((role) => MAY_PAIR.includes(role)) ?? false;

  return (
    <TransactionDetailScreen
      detail={detail}
      onMatch={
        mayPair
          ? async (candidate: CandidateView) => {
              'use server';
              return match(svjId, id, {
                targetType: candidate.targetType,
                targetId: candidate.targetId,
                amount: candidate.amount,
              });
            }
          : undefined
      }
    />
  );
};

export default Page;
