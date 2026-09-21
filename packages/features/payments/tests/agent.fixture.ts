import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { RequestContext } from '../../../kernel/src/context/index';
import { loadToolsFrom } from '../../../kernel/src/tools/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { IncomingTransaction } from '../domain/types';
import { importTransactions, listUnmatched } from '../service/index';

const TEMPLATE = new URL('./fixtures/payment-matcher.replay.json', import.meta.url).pathname;
const REPO_ROOT = new URL('../../../../', import.meta.url).pathname;

/** Every feature's tools, found the same way `apps/workers` finds them (task 017). */
export const loadEveryTool = (): Promise<number> =>
  loadToolsFrom([join(REPO_ROOT, 'packages/features/*/tools/*.ts')]);

/**
 * The recorded conversation, with the ids of this run written into it. A fixture is matched by
 * request content, and the content carries ids that only exist once the test has created them —
 * so the template names them and this fills them in (task 022).
 */
export const replayFixtureFor = async (replacements: Readonly<Record<string, string>>): Promise<string> => {
  const template = await readFile(TEMPLATE, 'utf8');
  const filled = Object.entries(replacements).reduce(
    (text, [name, value]) => text.replaceAll(name, value),
    template,
  );

  const directory = await mkdtemp(join(tmpdir(), 'domovnik-replay-'));
  const path = join(directory, 'payment-matcher.replay.json');
  await writeFile(path, filled, 'utf8');
  return path;
};

export const BANK_FEE = 'Poplatek za vedeni uctu';

/** The five movements of the batch: the ones a person would find on a real statement. */
export const residualBatch = (
  symbols: readonly string[],
  monthly: number,
): readonly IncomingTransaction[] => {
  const swap = (symbol: string): string =>
    symbol.slice(0, -2) + (symbol.at(-1) ?? '') + (symbol.at(-2) ?? '');

  return [
    { externalId: 'typo', bookedOn: '2026-03-14', amount: monthly, variableSymbol: swap(symbols[1] ?? '') },
    { externalId: 'joint', bookedOn: '2026-03-14', amount: monthly * 2, variableSymbol: symbols[2] },
    { externalId: 'nosymbol', bookedOn: '2026-03-14', amount: monthly * 3 },
    { externalId: 'fee', bookedOn: '2026-03-31', amount: -49, counterpartyName: BANK_FEE },
    {
      externalId: 'supplier',
      bookedOn: '2026-03-20',
      amount: -7400,
      counterpartyName: 'Dodavatel bez faktury',
      variableSymbol: '990001',
    },
  ];
};

export const seedResidual = async (
  ctx: RequestContext,
  svjId: SvjId,
  bankAccountId: Parameters<typeof importTransactions>[1]['bankAccountId'],
  symbols: readonly string[],
  monthly: number,
): Promise<ReadonlyMap<string, string>> => {
  await importTransactions(ctx, {
    svjId,
    bankAccountId,
    transactions: residualBatch(symbols, monthly),
  });

  const unmatched = await listUnmatched(ctx, svjId);
  return new Map(unmatched.map((one) => [one.externalId, one.id]));
};
