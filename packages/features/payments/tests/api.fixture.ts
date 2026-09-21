import * as composedSchema from '../../../db/src/schema';
import type { ApiHarness } from '../../../../apps/api/src/tests/api.fixture';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { BankAccountId } from '../domain/ids';
import { candidatesFor } from '../matching/search';
import { getTransaction, importTransactions, listUnmatched } from '../service/index';
import { MONTHLY, seedPaidHouse } from './payments.fixture';

/** Matching reaches `receivables` and `invoices`; the world is the composed one (task 023). */
export const TEST_SCHEMA: Record<string, unknown> = { ...composedSchema };

export interface SeededHouse {
  readonly svjId: SvjId;
  readonly bankAccountId: BankAccountId;
  readonly movementId: string;
  /** A candidate the code worked out, which is the only thing the API will accept. */
  readonly targetId: string;
}

const swap = (symbol: string): string => symbol.slice(0, -2) + (symbol.at(-1) ?? '') + (symbol.at(-2) ?? '');

/** One house, one payment with a mistyped symbol — the case the screens exist for. */
export const seedHouseVia = async (api: ApiHarness): Promise<SeededHouse> => {
  const ctx = api.tenant.ctx;
  const house = await seedPaidHouse(ctx, 3, 3);

  await importTransactions(ctx, {
    svjId: house.svjId,
    bankAccountId: house.bankAccountId,
    transactions: [
      {
        externalId: 'typo',
        bookedOn: '2026-03-14',
        amount: MONTHLY,
        variableSymbol: swap(house.symbols[0] ?? ''),
      },
    ],
  });

  const [movement] = await listUnmatched(ctx, house.svjId);
  if (movement === undefined) throw new RangeError('fixture');

  const candidate = (await candidatesFor(ctx, await getTransaction(ctx, movement.id))).find(
    (one) => one.because === 'symbol_typo',
  );
  if (candidate === undefined) throw new RangeError('candidate');

  return {
    svjId: house.svjId,
    bankAccountId: house.bankAccountId,
    movementId: movement.id,
    targetId: candidate.targetId,
  };
};
