import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { approvals } from '../../../kernel/src/approvals/index';
import { createContext, type RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { createUser } from '../../../kernel/src/identity/index';
import { executeTool } from '../../../kernel/src/tools/index';
import type { ApprovalId, UserId } from '../../../kernel/src/ids/index';
import { unitBalance } from '../../receivables/index';
import { candidatesFor } from '../matching/search';
import { getTransaction, importTransactions, listUnmatched } from '../service/index';
import { paymentProposeMatch } from '../tools/propose-match';
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
let accountant: RequestContext;
let accountantId: UserId;
let house: PaidHouse;
let movementId: string;
let target: { readonly targetId: string; readonly unitId?: string | undefined };

const swap = (symbol: string): string => symbol.slice(0, -2) + (symbol.at(-1) ?? '') + (symbol.at(-2) ?? '');

beforeAll(async () => {
  database = await startPaymentsDb();
  const tenant = await withTestTenant();
  ctx = tenant.ctx;
  house = await seedPaidHouse(ctx, 3, 3);

  accountantId = await createUser(ctx, {
    email: 'ucetni@example.test',
    displayName: 'Filip Účetní',
    password: 'test-password',
    roles: ['finance'],
  });
  accountant = createContext({
    tenantId: tenant.tenantId,
    actor: { type: 'user', id: accountantId, roles: ['finance'] },
  });

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
  movementId = movement.id;

  const found = (await candidatesFor(ctx, movement)).find((one) => one.because === 'symbol_typo');
  if (found === undefined) throw new RangeError('candidate');
  target = found;
}, 600_000);

afterAll(async () => {
  await database.stop();
});

const propose = async (): Promise<ApprovalId> => {
  const execution = await executeTool(ctx, paymentProposeMatch.name, {
    transactionId: movementId,
    targetType: 'prescription',
    targetId: target.targetId,
    amount: MONTHLY,
    reason: 'Prohozené číslice ve variabilním symbolu; částka i období sedí.',
  });
  if (execution.status !== 'pending_approval') throw new TypeError(execution.status);
  return execution.approvalId;
};

describe('payment.proposeMatch', () => {
  it('asks finance and parks the movement, pairing nothing', async () => {
    const approvalId = await propose();
    const approval = await approvals.get(ctx, approvalId);

    expect(approval.approvers).toStrictEqual([accountantId]);
    await expect(getTransaction(ctx, movementId as never)).resolves.toMatchObject({
      matchStatus: 'proposed',
    });
  }, 300_000);

  it('pairs it only once the accountant has said so', async () => {
    const approvalId = await propose();

    await approvals.decide(accountant, approvalId, 'approved');
    await withTenant(ctx, () => approvals.resume(ctx, approvalId));

    await expect(getTransaction(ctx, movementId as never)).resolves.toMatchObject({
      matchStatus: 'matched',
    });
    const unit = house.units[0];
    if (unit === undefined) throw new RangeError('fixture');

    const balance = await unitBalance(ctx, { svjId: house.svjId, unitId: unit.id });
    expect(balance.entries.some((entry) => entry.kind === 'payment')).toBe(true);
  }, 300_000);
});
