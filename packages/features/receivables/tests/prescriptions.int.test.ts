import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { generatePrescriptions, listPrescriptions } from '../service/index';
import type { Period } from '../domain/period';
import {
  DEMO_PLAN,
  FLOOR_AREA,
  seedHouse,
  startReceivablesDb,
  withTestTenant,
  type Seeded,
  type TestDatabase,
} from './receivables.fixture';

const PERIOD: Period = { year: 2026, month: 9 };
const UNIT_COUNT = 12;
/** 50 m² × 25 Kč + 1 800 Kč + 250 Kč — the plan the fixture prescribes. */
const EXPECTED_TOTAL = FLOOR_AREA * 25 + 1800 + 250;

let database: TestDatabase;
let ctx: RequestContext;
let house: Seeded;

beforeAll(async () => {
  database = await startReceivablesDb();
  ctx = (await withTestTenant()).ctx;
  house = await seedHouse(ctx, UNIT_COUNT);
}, 180_000);

afterAll(async () => {
  await database.stop();
});

describe('generatePrescriptions', () => {
  it('raises one prescription per unit of the SVJ', async () => {
    const created = await generatePrescriptions(ctx, {
      svjId: house.svjId,
      period: PERIOD,
      plan: DEMO_PLAN,
    });

    expect(created).toHaveLength(UNIT_COUNT);
    await expect(listPrescriptions(ctx, { svjId: house.svjId, period: PERIOD })).resolves.toHaveLength(
      UNIT_COUNT,
    );
  });

  it('charges what the plan says, itemised', async () => {
    const [first] = await listPrescriptions(ctx, { svjId: house.svjId, period: PERIOD });

    expect(first?.totalAmount).toBe(EXPECTED_TOTAL);
    expect(first?.items.map((item) => item.code)).toStrictEqual(['fond_oprav', 'sprava', 'zalohy_sluzby']);
    expect(first?.items.reduce((sum, item) => sum + item.amount, 0)).toBe(EXPECTED_TOTAL);
  });

  it('gives every unit its own variable symbol', async () => {
    const raised = await listPrescriptions(ctx, { svjId: house.svjId, period: PERIOD });
    const symbols = new Set(raised.map((one) => one.variableSymbol));

    expect(symbols.size).toBe(UNIT_COUNT);
  });

  it('adds nothing when the same month is generated again', async () => {
    const again = await generatePrescriptions(ctx, {
      svjId: house.svjId,
      period: PERIOD,
      plan: DEMO_PLAN,
    });

    expect(again).toStrictEqual([]);
    await expect(listPrescriptions(ctx, { svjId: house.svjId, period: PERIOD })).resolves.toHaveLength(
      UNIT_COUNT,
    );
  });
});
