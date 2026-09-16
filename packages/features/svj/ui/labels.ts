import type { UnitKind } from '../domain/types';

/** Czech is the language of everything a user reads (AGENTS.md §4); the code stays English. */
export const UNIT_KIND_LABEL: Readonly<Record<UnitKind, string>> = {
  apartment: 'Byt',
  commercial: 'Nebytový prostor',
  garage: 'Garáž',
};

const area = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 });

export const formatArea = (squareMetres: number): string => `${area.format(squareMetres)} m²`;

export const formatUnitCount = (count: number): string => {
  if (count === 1) return '1 jednotka';
  if (count >= 2 && count <= 4) return `${String(count)} jednotky`;
  return `${String(count)} jednotek`;
};
