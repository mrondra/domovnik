import {
  HASICI_A,
  INSTALATER,
  PLYN,
  REVIZE,
  REVIZE_ELEKTRO_A,
  REVIZE_PLYN_KOMINY_B,
  STRECHAR,
  VYTAHY_REVIZE,
} from './contracts-definitions';
import type { DemoContract } from './contract-shape';

export type { DemoContract } from './contract-shape';

const uklid = (amount: number): DemoContract => ({
  supplier: 'uklid',
  subject: 'Úklid společných prostor',
  budgetCategory: 'uklid',
  monthlyAmount: amount,
});

const vytahy = (amount: number): DemoContract => ({
  supplier: 'vytahy',
  subject: 'Servis a pravidelné prohlídky výtahů',
  budgetCategory: 'vytah',
  monthlyAmount: amount,
});

const elektrina = (amount: number): DemoContract => ({
  supplier: 'elektrina',
  subject: 'Dodávka elektřiny do společných prostor',
  budgetCategory: 'energie',
  monthlyAmount: amount,
});

const pojisteni = (amount: number): DemoContract => ({
  supplier: 'pojisteni',
  subject: 'Pojištění domu',
  budgetCategory: 'pojisteni',
  monthlyAmount: amount,
});

/**
 * What each of the three demo SVJ has agreed with whom, keyed by the order the `svj` seed writes
 * them in: the twelve-unit house, the eighty-unit one and the forty-unit one (zadání kap. 10).
 */
export const DEMO_CONTRACTS: readonly (readonly DemoContract[])[] = [
  [uklid(8500), vytahy(3200), elektrina(4200), pojisteni(2600), REVIZE_ELEKTRO_A, HASICI_A],
  [
    uklid(24_000),
    vytahy(9800),
    elektrina(11_500),
    pojisteni(6400),
    PLYN,
    REVIZE,
    VYTAHY_REVIZE,
    REVIZE_PLYN_KOMINY_B,
  ],
  [
    uklid(14_000),
    vytahy(5200),
    elektrina(7300),
    pojisteni(4100),
    REVIZE,
    INSTALATER,
    STRECHAR,
    VYTAHY_REVIZE,
  ],
];
