import type { BudgetCategory } from '../../domain/types';

export interface DemoContract {
  readonly supplier: string;
  readonly subject: string;
  readonly budgetCategory: BudgetCategory;
  /** `null` is a one-off job rather than a standing arrangement — the roofer, for instance. */
  readonly monthlyAmount: number | null;
}

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

const REVIZE: DemoContract = {
  supplier: 'revize',
  subject: 'Revize elektro, plyn a hasicí přístroje',
  budgetCategory: 'revize',
  monthlyAmount: null,
};

const PLYN: DemoContract = {
  supplier: 'plyn',
  subject: 'Dodávka plynu do kotelny',
  budgetCategory: 'energie',
  monthlyAmount: 24_000,
};

const INSTALATER: DemoContract = {
  supplier: 'instalater',
  subject: 'Pohotovost a drobné opravy vody',
  budgetCategory: 'opravy',
  monthlyAmount: null,
};

const STRECHAR: DemoContract = {
  supplier: 'strechar',
  subject: 'Rekonstrukce ploché střechy',
  budgetCategory: 'opravy',
  monthlyAmount: null,
};

/**
 * What each of the three demo SVJ has agreed with whom, keyed by the order the `svj` seed writes
 * them in: the twelve-unit house, the eighty-unit one and the forty-unit one (zadání kap. 10).
 */
export const DEMO_CONTRACTS: readonly (readonly DemoContract[])[] = [
  [uklid(8500), vytahy(3200), elektrina(4200), pojisteni(2600)],
  [uklid(24_000), vytahy(9800), elektrina(11_500), pojisteni(6400), PLYN, REVIZE],
  [uklid(14_000), vytahy(5200), elektrina(7300), pojisteni(4100), REVIZE, INSTALATER, STRECHAR],
];
