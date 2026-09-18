import { count, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { prescription } from '../schema';
import { DEMO_PLAN, SEEDED_MONTHS, monthsUpTo } from '../seed/plan';
import { receivablesSeed } from '../seed/receivables.seed';
import {
  FLOOR_AREA,
  seedHouse,
  startReceivablesDb,
  withTestTenant,
  type TestDatabase,
  type TestTenant,
} from './receivables.fixture';

const BIG_HOUSE = 20;
/** 50 m² × 35 Kč + 1 800 Kč + 250 Kč — what an apartment pays under the demo plan. */
const APARTMENT_TOTAL = FLOOR_AREA * 35 + 1800 + 250;

let database: TestDatabase;
let tenant: TestTenant;
let ctx: RequestContext;
let big: SvjId;

const runSeed = (): Promise<void> => receivablesSeed.run({ tenantId: tenant.tenantId, ctx });

const prescriptionsOf = (svjId: SvjId): Promise<number> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select({ total: count() }).from(prescription).where(eq(prescription.svjId, svjId));
    return rows[0]?.total ?? 0;
  });

beforeAll(async () => {
  database = await startReceivablesDb();
  tenant = await withTestTenant();
  ctx = tenant.ctx;
  await seedHouse(ctx, 3);
  big = (await seedHouse(ctx, BIG_HOUSE)).svjId;
  await runSeed();
}, 300_000);

afterAll(async () => {
  await database.stop();
});

describe('the receivables seed', () => {
  it('writes twelve months for every unit of every SVJ', async () => {
    await expect(prescriptionsOf(big)).resolves.toBe(BIG_HOUSE * SEEDED_MONTHS);
  });

  it('charges what the demo plan says', async () => {
    const rows = await withTenant(ctx, (tx) =>
      tx
        .select({ total: prescription.totalAmount })
        .from(prescription)
        .where(eq(prescription.svjId, big))
        .limit(1),
    );

    expect(Number(rows[0]?.total)).toBe(APARTMENT_TOTAL);
  });

  it('adds nothing on a second run', async () => {
    await runSeed();

    await expect(prescriptionsOf(big)).resolves.toBe(BIG_HOUSE * SEEDED_MONTHS);
  });

  it('declares that it needs the houses before it can bill them', () => {
    expect(receivablesSeed.dependsOn).toStrictEqual(['svj']);
    expect(DEMO_PLAN.items).toHaveLength(3);
  });
});

describe('monthsUpTo', () => {
  it('ends with the month it is given and counts back from there', () => {
    const periods = monthsUpTo(new Date('2026-09-17T00:00:00.000Z'));

    expect(periods).toHaveLength(SEEDED_MONTHS);
    expect(periods.at(-1)).toStrictEqual({ year: 2026, month: 9 });
    expect(periods.at(0)).toStrictEqual({ year: 2025, month: 10 });
  });
});
