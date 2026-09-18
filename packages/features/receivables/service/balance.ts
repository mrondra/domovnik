import type { RequestContext } from '../../../kernel/src/context/index';
import { receivablesAdapterFor, type ListDebtorsInput, type UnitBalanceInput } from '../adapters/index';
import type { UnitBalance } from '../domain/types';
import { assertReachable } from './reach';

export const unitBalance = async (ctx: RequestContext, input: UnitBalanceInput): Promise<UnitBalance> => {
  await assertReachable(ctx, input.svjId);
  return (await receivablesAdapterFor(ctx, input.svjId)).unitBalance(ctx, input);
};

/** The list the dunning agent works from (zadání kap. 6); sorted by how deep the debt is. */
export const listDebtors = async (
  ctx: RequestContext,
  input: ListDebtorsInput,
): Promise<readonly UnitBalance[]> => {
  await assertReachable(ctx, input.svjId);
  return (await receivablesAdapterFor(ctx, input.svjId)).listDebtors(ctx, input);
};
