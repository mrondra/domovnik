import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { listScenarios } from '../../demo/index';
import { readModels, SvjService } from '../../svj/index';
import { budgetStatus, listContracts, listSuppliers } from '../service/index';
import { DEMO_BUDGETS } from '../seed/data/budget';
import { DEMO_CONTRACTS } from '../seed/data/contracts';
import { DEMO_SCENARIOS } from '../seed/data/invoices';
import { DEMO_SUPPLIERS } from '../seed/data/suppliers';
import { withChecksum } from '../seed/data/ico';
import { invoicesSeed } from '../seed/invoices.seed';
import { startInvoicesWorld, withTestTenant, type InvoicesWorld } from './world.fixture';

const YEAR = new Date().getUTCFullYear();

let world: InvoicesWorld;
let ctx: RequestContext;
let tenantId: string;
let houses: readonly SvjId[];

const svj = new SvjService();

const runSeed = (): Promise<void> => invoicesSeed.run({ tenantId: tenantId as never, ctx });

beforeAll(async () => {
  world = await startInvoicesWorld();
  const tenant = await withTestTenant();
  ctx = tenant.ctx;
  tenantId = tenant.tenantId;

  for (const [index, name] of ['Kotlářská', 'Brandlova', 'Na Vyhlídce'].entries()) {
    await svj.createSvj(ctx, {
      name: `Společenství vlastníků ${name}`,
      ico: String(26_000_000 + index),
      address: { street: `${name} 1`, city: 'Praha', postalCode: '110 00' },
    });
  }

  const summaries = await readModels.svjSummary(ctx);
  const sequenced = await Promise.all(
    summaries.map(async (one) => ({ id: one.id, at: await readModels.svjSequence(ctx, one.id) })),
  );
  houses = [...sequenced].sort((a, b) => a.at - b.at).map((one) => one.id);

  await runSeed();
}, 300_000);

afterAll(async () => {
  await world.stop();
});

const houseAt = (index: number): SvjId => {
  const found = houses[index];
  if (found === undefined) throw new RangeError(String(index));
  return found;
};

describe('the invoices seed', () => {
  it('writes the address book with IČO that pass their own check digit', async () => {
    const suppliers = await listSuppliers(ctx);

    expect(suppliers).toHaveLength(DEMO_SUPPLIERS.length);
    for (const supplier of suppliers) {
      expect(withChecksum(supplier.ico.slice(0, 7))).toBe(supplier.ico);
    }
  });

  it('gives each house the contracts its own plan names', async () => {
    for (const [index, expected] of DEMO_CONTRACTS.entries()) {
      await expect(listContracts(ctx, houseAt(index))).resolves.toHaveLength(expected.length);
    }
  });

  it('plans the budget of the current year for every house', async () => {
    const planned = DEMO_BUDGETS[0]?.[0];
    if (planned === undefined) throw new RangeError('budget');

    await expect(
      budgetStatus(ctx, { svjId: houseAt(0), year: YEAR, category: planned.category }),
    ).resolves.toMatchObject({ planned: planned.plannedAmount, spent: 0 });
  });

  it('spends the line it says is nearly spent, through invoices that were really approved', async () => {
    const status = await budgetStatus(ctx, { svjId: houseAt(2), year: YEAR, category: 'opravy' });

    expect(status.spent).toBeGreaterThan(0);
    expect(status.remaining).toBeLessThan(status.planned * 0.2);
  });

  it('prepares every scenario the demo can run', async () => {
    const scenarios = await listScenarios(ctx);

    expect(scenarios.map((one) => one.code).sort()).toStrictEqual(
      DEMO_SCENARIOS.map((one) => one.code).sort(),
    );
    expect(scenarios.every((one) => one.description.length > 40)).toBe(true);
  });

  it('adds nothing on a second run', async () => {
    await runSeed();

    await expect(listSuppliers(ctx)).resolves.toHaveLength(DEMO_SUPPLIERS.length);
    await expect(listContracts(ctx, houseAt(0))).resolves.toHaveLength(DEMO_CONTRACTS[0]?.length ?? 0);
    await expect(listScenarios(ctx)).resolves.toHaveLength(DEMO_SCENARIOS.length);
  });
});
