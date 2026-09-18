import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { executeTool, requireTool } from '../../../kernel/src/tools/index';
import type { Period } from '../domain/period';
import { generatePrescriptions } from '../service/index';
import { receivablesListDebtors } from '../tools/list-debtors';
import { receivablesListPrescriptions } from '../tools/list-prescriptions';
import { receivablesUnitBalance } from '../tools/unit-balance';
import {
  DEMO_PLAN,
  seedHouse,
  startReceivablesDb,
  withTestTenant,
  type Seeded,
  type TestDatabase,
} from './receivables.fixture';

const PERIOD: Period = { year: 2026, month: 9 };
const UNIT_COUNT = 3;

let database: TestDatabase;
let ctx: RequestContext;
let house: Seeded;
let other: SvjId;

beforeAll(async () => {
  database = await startReceivablesDb();
  ctx = (await withTestTenant()).ctx;
  house = await seedHouse(ctx, UNIT_COUNT);
  other = (await seedHouse(ctx, 1)).svjId;
  await generatePrescriptions(ctx, { svjId: house.svjId, period: PERIOD, plan: DEMO_PLAN });
}, 180_000);

afterAll(async () => {
  await database.stop();
});

const TOOLS = [receivablesListPrescriptions, receivablesUnitBalance, receivablesListDebtors];

const run = (context: RequestContext, name: string, input: unknown): Promise<unknown> =>
  executeTool(context, name, input).then((execution) =>
    execution.status === 'ok' ? execution.output : execution,
  );

const scoped = (): RequestContext => ({ ...ctx, svjScope: [other] });

describe('the read tools of this feature', () => {
  it.each(TOOLS)('registers $name as read-only', (tool) => {
    const registered = requireTool(tool.name);

    expect(registered.readOnly).toBe(true);
    expect(registered.userComposable).toBe(true);
    expect(registered.permission).toBe('finance.read');
  });

  it('never asks for an approval', async () => {
    const asked = [
      await requireTool(receivablesListPrescriptions.name).approval(ctx, {
        svjId: house.svjId,
        period: PERIOD,
      }),
      await requireTool(receivablesUnitBalance.name).approval(ctx, {
        svjId: house.svjId,
        unitId: house.units[0]?.id,
      }),
      await requireTool(receivablesListDebtors.name).approval(ctx, {
        svjId: house.svjId,
        minDebt: 1,
      }),
    ];

    expect(asked).toMatchObject([{ required: false }, { required: false }, { required: false }]);
  });
});

describe('receivables.listPrescriptions', () => {
  it('answers the month it was asked about', async () => {
    const output = await run(ctx, receivablesListPrescriptions.name, {
      svjId: house.svjId,
      period: PERIOD,
    });

    expect(output).toHaveLength(UNIT_COUNT);
  });

  it('hides an SVJ outside the scope of the credential', async () => {
    await expect(
      run(scoped(), receivablesListPrescriptions.name, { svjId: house.svjId, period: PERIOD }),
    ).rejects.toThrow(/SVJ nenalezeno/);
  });

  it('rejects input that does not match the schema', async () => {
    await expect(
      run(ctx, receivablesListPrescriptions.name, { svjId: house.svjId, period: { year: 2026 } }),
    ).rejects.toThrow(/Neplatný vstup/);
  });
});

describe('receivables.unitBalance and receivables.listDebtors', () => {
  it('owes the whole prescription while nothing has been paid', async () => {
    const unitId = house.units[0]?.id;

    expect(await run(ctx, receivablesUnitBalance.name, { svjId: house.svjId, unitId })).toMatchObject({
      oldestUnpaidPeriod: PERIOD,
    });
  });

  it('names every unit as a debtor until payments are imported', async () => {
    const output = await run(ctx, receivablesListDebtors.name, { svjId: house.svjId, minDebt: 1 });

    expect(output).toHaveLength(UNIT_COUNT);
  });
});
