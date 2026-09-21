import type { RequestContext } from '../../../kernel/src/context/index';
import { linkOf } from '../../accounting-sync/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { BankAdapter } from './bank.adapter';
import { pohodaBank } from './pohoda-bank';
import { syntheticBank } from './synthetic/index';

/**
 * The one place that names an implementation. Which one serves a house is written in its
 * accounting link (`config.bankSource`), so a house whose statements come from Pohoda and one
 * whose statements are generated can sit side by side in the same demonstration (task 025).
 */
export const bankAdapterFor = async (ctx: RequestContext, svjId: SvjId): Promise<BankAdapter> => {
  const link = await linkOf(ctx, svjId);
  return link?.config?.['bankSource'] === 'pohoda' ? pohodaBank : syntheticBank;
};
