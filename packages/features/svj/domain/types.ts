import type { SvjId, UserId } from '../../../kernel/src/ids/index';
import type { BuildingId, DepartmentId, UnitId } from './ids';
import type { Share } from './share';

export type UnitKind = 'apartment' | 'commercial' | 'garage';

export interface Address {
  readonly street: string;
  readonly city: string;
  readonly postalCode: string;
}

export interface Svj {
  readonly id: SvjId;
  readonly name: string;
  readonly ico: string;
  readonly address: Address;
  /** Users sitting on the committee; they reach this SVJ through a `committee` role row. */
  readonly committee: readonly UserId[];
  readonly bankAccounts: readonly string[];
}

/** What the cross-SVJ overview and the SVJ switcher need — no address, no accounts. */
export interface SvjSummary {
  readonly id: SvjId;
  readonly name: string;
  readonly unitCount: number;
}

export interface Building {
  readonly id: BuildingId;
  readonly svjId: SvjId;
  readonly label: string;
  readonly street: string;
}

export interface Unit {
  readonly id: UnitId;
  readonly svjId: SvjId;
  readonly buildingId: BuildingId;
  readonly number: string;
  readonly kind: UnitKind;
  readonly share: Share;
  readonly floorArea: number;
}

export interface Department {
  readonly id: DepartmentId;
  readonly code: string;
  readonly name: string;
}

export interface CreateSvjInput {
  readonly name: string;
  readonly ico: string;
  readonly address: Address;
  readonly committee?: readonly UserId[] | undefined;
  readonly bankAccounts?: readonly string[] | undefined;
}

export interface UpdateSvjInput {
  readonly name?: string | undefined;
  readonly address?: Address | undefined;
  readonly committee?: readonly UserId[] | undefined;
  readonly bankAccounts?: readonly string[] | undefined;
}

export interface CreateBuildingInput {
  readonly svjId: SvjId;
  readonly label: string;
  readonly street: string;
}

export interface CreateUnitInput {
  readonly svjId: SvjId;
  readonly buildingId: BuildingId;
  readonly number: string;
  readonly kind: UnitKind;
  readonly share: Share;
  readonly floorArea: number;
}

export interface UpdateUnitInput {
  readonly kind?: UnitKind | undefined;
  readonly share?: Share | undefined;
  readonly floorArea?: number | undefined;
}
