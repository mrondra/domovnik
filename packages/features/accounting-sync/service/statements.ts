import type { RequestContext } from '../../../kernel/src/context/index';
import { DomainError } from '../../../kernel/src/errors/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { accountingAdapterFor, pohodaMock } from '../adapters/index';
import type { BankStatementLine, IsoDay } from '../domain/types';
import { runJob } from './jobs';
import { requireLink, touchSync } from './links';

export interface StatementRange {
  readonly svjId: SvjId;
  readonly from: IsoDay;
  readonly to: IsoDay;
}

/**
 * The movements the accounting holds for a period. `payments` reads its statements through here
 * rather than from a bank of its own, because Pohoda already has the account (zadání kap. 8).
 */
export const fetchStatements = async (
  ctx: RequestContext,
  range: StatementRange,
): Promise<readonly BankStatementLine[]> => {
  const link = await requireLink(ctx, range.svjId);
  const adapter = await accountingAdapterFor(ctx, range.svjId);

  return adapter.fetchBankStatements(ctx, {
    svjId: range.svjId,
    accountIco: link.companyIco,
    from: range.from,
    to: range.to,
  });
};

/**
 * Telling the demo's accounting what the bank did. A real Pohoda is told this by the bank, never by
 * us — so this refuses anything but the mock instead of inventing a write the real adapter has no
 * business making (ADR 0005).
 */
export const recordStatements = async (
  ctx: RequestContext,
  svjId: SvjId,
  lines: readonly BankStatementLine[],
): Promise<void> => {
  const adapter = await accountingAdapterFor(ctx, svjId);
  if (adapter.kind !== 'mock') {
    throw new DomainError('Do reálného účetnictví se výpis nezapisuje', {
      code: 'statements_not_writable',
      details: { svjId, kind: adapter.kind },
    });
  }

  await pohodaMock.rememberStatements(ctx, svjId, lines);
};

/**
 * Asking the accounting what it has for a period, written down as a job. It imports nothing: what
 * a movement turns out to be about is `payments`' business, and this feature only ever talks to
 * the accounting (docs/engineering.md §2).
 */
export const syncStatements = async (
  ctx: RequestContext,
  range: StatementRange,
): Promise<{ readonly count: number }> => {
  const count = await runJob(
    ctx,
    {
      svjId: range.svjId,
      kind: 'import_statements',
      payload: { entityId: range.svjId, from: range.from, to: range.to },
    },
    async () => {
      const lines = await fetchStatements(ctx, range);
      return { result: { count: lines.length }, value: lines.length };
    },
  );

  await touchSync(ctx, range.svjId);
  return { count };
};
