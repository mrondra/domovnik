import { svjIdSchema, userIdSchema, type SvjId } from '../../../kernel/src/ids/index';
import { buildingIdSchema, unitIdSchema, departmentIdSchema } from '../domain/ids';
import { share } from '../domain/share';
import type { Building, Department, Svj, Unit, UnitKind } from '../domain/types';

interface SvjRow {
  readonly id: string;
  readonly name: string;
  readonly ico: string;
  readonly street: string;
  readonly city: string;
  readonly postalCode: string;
  readonly committee: readonly string[];
  readonly bankAccounts: readonly string[];
}

interface BuildingRow {
  readonly id: string;
  readonly svjId: string;
  readonly label: string;
  readonly street: string;
}

interface UnitRow {
  readonly id: string;
  readonly svjId: string;
  readonly buildingId: string;
  readonly number: string;
  readonly kind: UnitKind;
  readonly shareNumerator: number;
  readonly shareDenominator: number;
  readonly floorArea: string;
}

interface DepartmentRow {
  readonly id: string;
  readonly code: string;
  readonly name: string;
}

/** Drizzle hands back plain strings; the branded ids and the fraction are rebuilt here, once. */
export const toSvj = (row: SvjRow): Svj => ({
  id: svjIdSchema.parse(row.id),
  name: row.name,
  ico: row.ico,
  address: { street: row.street, city: row.city, postalCode: row.postalCode },
  committee: row.committee.map((id) => userIdSchema.parse(id)),
  bankAccounts: [...row.bankAccounts],
});

export const toBuilding = (row: BuildingRow): Building => ({
  id: buildingIdSchema.parse(row.id),
  svjId: svjIdSchema.parse(row.svjId),
  label: row.label,
  street: row.street,
});

export const toUnit = (row: UnitRow): Unit => ({
  id: unitIdSchema.parse(row.id),
  svjId: svjIdSchema.parse(row.svjId),
  buildingId: buildingIdSchema.parse(row.buildingId),
  number: row.number,
  kind: row.kind,
  share: share(row.shareNumerator, row.shareDenominator),
  floorArea: Number(row.floorArea),
});

export const toDepartment = (row: DepartmentRow): Department => ({
  id: departmentIdSchema.parse(row.id),
  code: row.code,
  name: row.name,
});

/** A numeric column is written as a string, so the precision of the column decides, not the float. */
export const asNumeric = (value: number): string => value.toFixed(2);

export const asSvjId = (value: string): SvjId => svjIdSchema.parse(value);
