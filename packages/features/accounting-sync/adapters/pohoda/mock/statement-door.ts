import type { RequestContext } from '../../../../../kernel/src/context/index';
import type { SvjId } from '../../../../../kernel/src/ids/index';
import type { BankStatementLine, FetchStatementsInput } from '../../../domain/types';
import { bankStatementRequest } from '../xml/builders';
import { packFor, refFor } from './refs';
import { asStoredLine, linesWithin } from './statement-lines';
import { statementsFor } from './statements';
import { recallKind, remember } from './store';

const STATEMENT_LINE = 'statement-line';

/**
 * What the bank told the accounting. In production it tells it directly; in the demo `payments`
 * writes the generated statement in here and reads it straight back (task 025).
 */
export const writeStatements = async (
  ctx: RequestContext,
  svjId: SvjId,
  lines: readonly BankStatementLine[],
): Promise<void> => {
  for (const line of lines) {
    await remember(ctx, svjId, {
      ref: line.externalId,
      kind: STATEMENT_LINE,
      xml: '',
      state: asStoredLine(line),
    });
  }
};

/**
 * The request document is built and kept even though the answer comes from the table: the mock
 * keeps every `dataPack` a real adapter would have sent, which is what makes the two comparable.
 *
 * A house nobody has told anything falls back to the derived statement, so the contract test has
 * movements to read without a demo behind it.
 */
export const readStatements = async (
  ctx: RequestContext,
  input: FetchStatementsInput,
): Promise<readonly BankStatementLine[]> => {
  const ref = refFor('lstk', `${input.accountIco}:${input.from}:${input.to}`);
  await remember(ctx, input.svjId, {
    ref,
    kind: 'statement-request',
    xml: packFor({
      ico: input.accountIco,
      note: `Výpis ${input.from} – ${input.to}`,
      id: ref,
      body: bankStatementRequest(input),
    }),
    state: { from: input.from, to: input.to },
  });

  const stored = await recallKind(ctx, input.svjId, STATEMENT_LINE);
  const held = linesWithin(
    stored.map((document) => document.state),
    input,
  );

  return held.length === 0 ? statementsFor(input) : held;
};
