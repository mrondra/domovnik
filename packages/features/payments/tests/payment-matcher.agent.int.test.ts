import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { approvals } from '../../../kernel/src/approvals/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { schema, withTenant } from '../../../kernel/src/db/index';
import { replayLlm, runAgentInTest } from '../../../kernel/src/testing/index';
import { paymentMatcher } from '../agents/payment-matcher/agent';
import { paymentCandidates } from '../tools/candidates';
import { paymentMarkIgnored } from '../tools/ignore';
import { paymentListUnmatched } from '../tools/list-unmatched';
import { candidatesFor } from '../matching/search';
import { proposeMatchSchema } from '../domain/proposal';
import { getTransaction } from '../service/index';
import { loadEveryTool, replayFixtureFor, seedResidual } from './agent.fixture';
import {
  MONTHLY,
  seedPaidHouse,
  startPaymentsDb,
  withTestTenant,
  type PaidHouse,
  type TestDatabase,
} from './payments.fixture';

let database: TestDatabase;
let ctx: RequestContext;
let house: PaidHouse;
let ids: ReadonlyMap<string, string>;
let fixture: string;

const idOf = (externalId: string): string => {
  const found = ids.get(externalId);
  if (found === undefined) throw new RangeError(externalId);
  return found;
};

const statusOf = (externalId: string) =>
  getTransaction(ctx, idOf(externalId) as never).then((one) => one.matchStatus);

beforeAll(async () => {
  database = await startPaymentsDb();
  ctx = (await withTestTenant()).ctx;
  await loadEveryTool();

  house = await seedPaidHouse(ctx, 4, 3);
  ids = await seedResidual(ctx, house.svjId, house.bankAccountId, house.symbols, MONTHLY);

  const typo = await getTransaction(ctx, idOf('typo') as never);
  const candidates = await candidatesFor(ctx, typo);

  fixture = await replayFixtureFor({
    SVJ_ID: house.svjId,
    TYPO_ID: idOf('typo'),
    FEE_ID: idOf('fee'),
    TYPO_TARGET: candidates.find((one) => one.because === 'symbol_typo')?.targetId ?? '',
  });
}, 600_000);

afterAll(async () => {
  await database.stop();
});

const agentRuns = (): Promise<number> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select().from(schema.agentRun);
    return rows.length;
  });

describe('payment-matcher over a batch', () => {
  it('is composed of tools that only read, and of proposals a person decides about', () => {
    expect([paymentListUnmatched.readOnly, paymentCandidates.readOnly]).toStrictEqual([true, true]);
    expect(paymentMarkIgnored.proposal).toBe(true);
    expect(paymentMatcher.tools).toContain(paymentCandidates.name);
  });

  it('reads the whole batch in one run and leaves proposals behind it', async () => {
    const result = await runAgentInTest(
      { ...ctx, svjScope: [house.svjId] },
      paymentMatcher,
      {
        kind: 'event',
        name: 'finance.transactions.unmatched',
        payload: { svjId: house.svjId, transactionIds: [...ids.values()] },
      },
      { llm: replayLlm(fixture), maxTurns: 10 },
    );

    expect(result.status).toBe('succeeded');
    await expect(agentRuns()).resolves.toBe(1);
  }, 300_000);

  it('proposes the payment with the mistyped symbol, and waits for finance', async () => {
    await expect(statusOf('typo')).resolves.toBe('proposed');
  });

  it('marks the bank charge as nothing to pair', async () => {
    await expect(statusOf('fee')).resolves.toBe('ignored');
  });

  it('leaves alone what it could not work out, rather than guessing', async () => {
    await expect(statusOf('joint')).resolves.toBe('unmatched');
    await expect(statusOf('nosymbol')).resolves.toBe('unmatched');
    await expect(statusOf('supplier')).resolves.toBe('unmatched');
  });

  it('never proposes a target the code did not put on the list', async () => {
    const pending = await approvals.list(ctx, { status: 'pending' });
    const proposals = pending.filter((one) => one.toolName === 'payment.proposeMatch');
    expect(proposals).toHaveLength(1);

    for (const summary of proposals) {
      const detail = await approvals.get(ctx, summary.id);
      const proposed = proposeMatchSchema.parse(detail.input);
      const movement = await getTransaction(ctx, proposed.transactionId as never);
      const candidates = await candidatesFor(ctx, movement);

      expect(candidates.map((one) => one.targetId)).toContain(proposed.targetId);
    }
  }, 300_000);
});
