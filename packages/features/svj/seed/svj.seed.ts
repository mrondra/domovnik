import { eq } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { defineSeed, type SeedContext } from '../../../kernel/src/seed/index';
import type { Building } from '../domain/types';
import { share } from '../domain/share';
import { department, svj } from '../schema';
import { createBuilding, createDepartment, createSvj, createUnit, updateSvj } from '../service/index';
import { ensureChair } from './committee';
import { DEMO_DEPARTMENTS, DEMO_SVJ, type DemoSvj } from './data';
import { planUnits, shareDenominatorOf, shareNumeratorOf } from './units';

const seededDepartments = (ctx: RequestContext): Promise<readonly string[]> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select({ code: department.code }).from(department);
    return rows.map((row) => row.code);
  });

const isSeeded = (ctx: RequestContext, ico: string): Promise<boolean> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select({ id: svj.id }).from(svj).where(eq(svj.ico, ico)).limit(1);
    return rows.length > 0;
  });

const seedBuildings = async (ctx: RequestContext, demo: DemoSvj, svjId: SvjId): Promise<Building[]> => {
  const created: Building[] = [];
  for (const plan of demo.buildings) {
    created.push(await createBuilding(ctx, { svjId, ...plan }));
  }
  return created;
};

/** One transaction per SVJ: 80 units are 80 inserts, and a half-seeded house is worse than none. */
const seedOne = (ctx: RequestContext, demo: DemoSvj): Promise<void> =>
  withTenant(ctx, async () => {
    const created = await createSvj(ctx, {
      name: demo.name,
      ico: demo.ico,
      address: demo.address,
      bankAccounts: demo.bankAccounts,
    });

    const chairId = await ensureChair(ctx, {
      email: demo.chairEmail,
      displayName: demo.chairName,
      svjId: created.id,
    });
    await updateSvj(ctx, created.id, { committee: [chairId] });

    const buildings = await seedBuildings(ctx, demo, created.id);
    const units = planUnits(
      demo.unitCount,
      buildings.map((building) => building.id),
    );
    const denominator = shareDenominatorOf(units);

    for (const unit of units) {
      await createUnit(ctx, {
        svjId: created.id,
        buildingId: unit.buildingId,
        number: unit.number,
        kind: unit.kind,
        share: share(shareNumeratorOf(unit), denominator),
        floorArea: unit.floorArea,
      });
    }
  });

/**
 * Idempotent by IČO and by department code (docs/engineering.md §8): an SVJ that is already there is
 * left exactly as it is, so a re-run neither duplicates a house nor overwrites what a demo changed.
 */
export const svjSeed = defineSeed({
  name: 'svj',
  run: async ({ ctx }: SeedContext): Promise<void> => {
    const present = new Set(await seededDepartments(ctx));
    for (const dept of DEMO_DEPARTMENTS.filter((it) => !present.has(it.code))) {
      await createDepartment(ctx, dept);
    }

    for (const demo of DEMO_SVJ) {
      if (!(await isSeeded(ctx, demo.ico))) await seedOne(ctx, demo);
    }
  },
});
