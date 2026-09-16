import type { Address, UnitKind } from '../domain/types';

export interface DemoBuilding {
  readonly label: string;
  readonly street: string;
}

export interface DemoSvj {
  readonly name: string;
  readonly ico: string;
  readonly address: Address;
  readonly bankAccounts: readonly string[];
  readonly buildings: readonly DemoBuilding[];
  readonly unitCount: number;
  /** E-mail of the committee member seeded for this SVJ; the local part is the stable key. */
  readonly chairEmail: string;
  readonly chairName: string;
}

/** Invented companies at plausible Prague addresses — the seed never carries anything real. */
export const DEMO_SVJ: readonly DemoSvj[] = [
  {
    name: 'Společenství vlastníků Kotlářská 14',
    ico: '26134586',
    address: { street: 'Kotlářská 14', city: 'Praha 8', postalCode: '180 00' },
    bankAccounts: ['2801234567/2010'],
    buildings: [{ label: 'Kotlářská 14', street: 'Kotlářská 14' }],
    unitCount: 12,
    chairEmail: 'vybor-kotlarska@demo.domovnik.test',
    chairName: 'Jana Kotlářová',
  },
  {
    name: 'Společenství vlastníků Brandlova 2140',
    ico: '27309452',
    address: { street: 'Brandlova 2140/7', city: 'Praha 4', postalCode: '149 00' },
    bankAccounts: ['2901234568/2010', '123456789/0800'],
    buildings: [
      { label: 'Vchod A', street: 'Brandlova 2140/7' },
      { label: 'Vchod B', street: 'Brandlova 2141/9' },
      { label: 'Vchod C', street: 'Brandlova 2142/11' },
    ],
    unitCount: 80,
    chairEmail: 'vybor-brandlova@demo.domovnik.test',
    chairName: 'Petr Brandl',
  },
  {
    name: 'Společenství vlastníků Na Vyhlídce 6',
    ico: '28471202',
    address: { street: 'Na Vyhlídce 6', city: 'Praha 5', postalCode: '150 00' },
    bankAccounts: ['3001234569/2010'],
    buildings: [
      { label: 'Vchod 6', street: 'Na Vyhlídce 6' },
      { label: 'Vchod 8', street: 'Na Vyhlídce 8' },
    ],
    unitCount: 40,
    chairEmail: 'vybor-vyhlidka@demo.domovnik.test',
    chairName: 'Marie Vyhlídková',
  },
];

/** The management company's own organisation (zadání kap. 4), not tied to any SVJ. */
export const DEMO_DEPARTMENTS: readonly { readonly code: string; readonly name: string }[] = [
  { code: 'maintenance', name: 'Údržba' },
  { code: 'finance', name: 'Finance' },
  { code: 'cleaning', name: 'Úklid' },
  { code: 'technicians', name: 'Technici' },
  { code: 'administration', name: 'Správa' },
];

export const AREA_BY_KIND: Readonly<Record<UnitKind, readonly number[]>> = {
  apartment: [42.5, 58.3, 74.1, 86.9, 63.7],
  commercial: [118.4],
  garage: [16.2],
};
