import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import {
  startTestDb,
  withTestTenant,
  type TestDatabase,
  type TestTenant,
} from '../../../kernel/src/testing/index';
import * as composedSchema from '../../../db/src/schema';
import { SvjService, type Unit } from '../../svj/index';
import type { PrescriptionPlan } from '../domain/types';

/**
 * Generating prescriptions reads the units of the SVJ, so the test database needs `svj`'s tables as
 * well as this feature's — and those are not this feature's to import. The composed schema `pnpm
 * db:generate` writes is the one place that legitimately names every table there is.
 */
export const startReceivablesDb = (): Promise<TestDatabase> => startTestDb({ ...composedSchema });

/** Fond oprav per square metre, the advances per unit — the shape zadání kap. 4 describes. */
export const DEMO_PLAN: PrescriptionPlan = {
  items: [
    { code: 'fond_oprav', label: 'Fond oprav', basis: 'per_square_metre', rate: 25 },
    { code: 'zalohy_sluzby', label: 'Zálohy na služby', basis: 'per_unit', rate: 1800 },
    { code: 'sprava', label: 'Správa', basis: 'per_unit', rate: 250 },
  ],
  dueDayOfMonth: 15,
};

export const FLOOR_AREA = 50;

export interface Seeded {
  readonly svjId: SvjId;
  readonly units: readonly Unit[];
}

let sequence = 0;

/** One house of identical flats, which is all a prescription run needs in order to be checkable. */
export const seedHouse = async (ctx: RequestContext, unitCount: number): Promise<Seeded> => {
  sequence += 1;
  const svj = new SvjService();
  const created = await svj.createSvj(ctx, {
    name: `SVJ ${String(sequence)}`,
    ico: String(10_000_000 + sequence),
    address: { street: 'Krátká 1', city: 'Praha 1', postalCode: '110 00' },
  });

  const house = await svj.createBuilding(ctx, {
    svjId: created.id,
    label: 'Vchod A',
    street: 'Krátká 1',
  });

  for (let number = 1; number <= unitCount; number += 1) {
    await svj.createUnit(ctx, {
      svjId: created.id,
      buildingId: house.id,
      number: String(number),
      kind: 'apartment',
      share: { numerator: 5000, denominator: unitCount * 5000 },
      floorArea: FLOOR_AREA,
    });
  }

  return { svjId: created.id, units: await svj.listUnits(ctx, created.id) };
};

export { withTestTenant };
export type { TestDatabase, TestTenant };
