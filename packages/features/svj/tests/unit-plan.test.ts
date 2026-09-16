import { describe, expect, it } from 'vitest';
import { buildingIdSchema, type BuildingId } from '../domain/ids';
import { planUnits, shareDenominatorOf, shareNumeratorOf } from '../seed/units';

const BUILDINGS: readonly BuildingId[] = [
  buildingIdSchema.parse('8f14e45f-ceea-467a-9f30-1b0e0b0e0001'),
  buildingIdSchema.parse('8f14e45f-ceea-467a-9f30-1b0e0b0e0002'),
];

describe('the demo unit plan', () => {
  it('numbers every unit of the house from one', () => {
    expect(planUnits(12, BUILDINGS).map((unit) => unit.number)).toEqual(
      Array.from({ length: 12 }, (_unused, index) => String(index + 1)),
    );
  });

  it('spreads the units over the entrances of the house', () => {
    const perBuilding = new Set(planUnits(80, BUILDINGS).map((unit) => unit.buildingId));

    expect(perBuilding).toEqual(new Set(BUILDINGS));
  });

  it('puts a shop on the ground floor of the larger houses only', () => {
    expect(planUnits(12, BUILDINGS).some((unit) => unit.kind === 'commercial')).toBe(false);
    expect(planUnits(40, BUILDINGS)[0]?.kind).toBe('commercial');
  });

  it('adds up to the whole house, so every share is a share of the same thing', () => {
    const units = planUnits(40, BUILDINGS);

    expect(units.reduce((sum, unit) => sum + shareNumeratorOf(unit), 0)).toBe(shareDenominatorOf(units));
  });

  it('produces the same plan on every run', () => {
    expect(planUnits(40, BUILDINGS)).toEqual(planUnits(40, BUILDINGS));
  });
});
