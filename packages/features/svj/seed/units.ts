import { DomainError } from '../../../kernel/src/errors/index';
import type { BuildingId } from '../domain/ids';
import type { UnitKind } from '../domain/types';
import { AREA_BY_KIND } from './data';

export interface PlannedUnit {
  readonly number: string;
  readonly kind: UnitKind;
  readonly floorArea: number;
  readonly buildingId: BuildingId;
}

const GARAGE_SHARE = 0.1;

/** One shop on the ground floor of the larger houses, a tenth in garages, the rest flats. */
const kindOf = (index: number, total: number): UnitKind => {
  if (index === 0 && total >= 40) return 'commercial';
  return index >= total - Math.round(total * GARAGE_SHARE) ? 'garage' : 'apartment';
};

const pick = <T>(values: readonly T[], index: number): T => {
  const found = values[index % values.length];
  if (found === undefined) {
    throw new DomainError('Seed nemá z čeho vybírat', { code: 'seed_empty_choice' });
  }
  return found;
};

/**
 * Deterministic on purpose: re-running the seed has to produce the same units, and a demo whose
 * numbers move between runs is a demo nobody can point at.
 */
export const planUnits = (total: number, buildingIds: readonly BuildingId[]): readonly PlannedUnit[] =>
  Array.from({ length: total }, (_unused, index) => {
    const kind = kindOf(index, total);
    return {
      number: String(index + 1),
      kind,
      floorArea: pick(AREA_BY_KIND[kind], index),
      buildingId: pick(buildingIds, index),
    };
  });

/** The denominator is the whole house in square centimetres, so every share is an exact integer. */
export const shareDenominatorOf = (units: readonly PlannedUnit[]): number =>
  units.reduce((total, unit) => total + shareNumeratorOf(unit), 0);

export const shareNumeratorOf = (unit: PlannedUnit): number => Math.round(unit.floorArea * 100);
