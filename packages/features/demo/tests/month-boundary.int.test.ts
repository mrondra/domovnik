import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { listBankAccounts } from '../../payments/index';
import { listDebtors } from '../../receivables/index';
import { readModels } from '../../svj/index';
import { runScenario } from '../service/index';
import { seedDemoTenantWith, startDemoWorld, useRecordedLlm, type DemoWorld } from './demo.fixture';

type SvjId = Awaited<ReturnType<typeof readModels.svjSummary>>[number]['id'];

/**
 * Seeded prescriptions come due on the 15th. The demonstration used to seed the running month, so
 * from the 1st to the 14th its statement could not contain that payment and every unit stayed a
 * debtor. One comfortable date would never have shown it; each day around the boundary is a case.
 */
const DAYS = [
  ['the day before the turn of the month', '2026-09-30T19:05:00Z'],
  ['the first morning of the month', '2026-10-01T05:33:00Z'],
  ['the last minute before the 15th', '2026-10-14T23:59:00Z'],
  ['the 15th, the due day', '2026-10-15T00:00:00Z'],
] as const;

describe.each(DAYS)('the demonstration on %s', (_name, now) => {
  let world: DemoWorld;
  let ctx: RequestContext;
  let banked: { svjId: SvjId; accountId: string; debtors: number }[];

  beforeAll(async () => {
    world = await startDemoWorld();
    useRecordedLlm();

    // Only `Date` is fake, and it is frozen: the boundary case at 23:59 must stay on the 14th
    // however slow the machine is. Timers and ticks stay real, so waiting on the containers
    // cannot hang. It starts after the containers are up and ends before they are stopped.
    vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: false });
    vi.setSystemTime(new Date(now));
    ctx = await seedDemoTenantWith();

    const houses = await readModels.svjSummary(ctx);
    const found = await Promise.all(
      houses.map(async (house) => ({
        svjId: house.id,
        accounts: await listBankAccounts(ctx, house.id),
        debtors: (await listDebtors(ctx, { svjId: house.id, minDebt: 1 })).length,
      })),
    );
    banked = found.flatMap((one) =>
      one.accounts[0] === undefined || one.debtors === 0
        ? []
        : [{ svjId: one.svjId, accountId: one.accounts[0].id, debtors: one.debtors }],
    );
  }, 600_000);

  afterAll(async () => {
    vi.useRealTimers();
    await world.stop();
  });

  it('seeds houses with a bank account and debts to be paid', () => {
    expect(banked.length).toBeGreaterThan(0);
  });

  it('has fewer debtors once the statement is read, whichever day it is', async () => {
    for (const one of banked) {
      await runScenario(ctx, `bank-sync-${one.accountId}`);
      const after = (await listDebtors(ctx, { svjId: one.svjId, minDebt: 1 })).length;

      expect(after).toBeLessThan(one.debtors);
    }
  }, 300_000);
});
