import type { DemoContract } from './contract-shape';

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

/** SVJ A: smluvní firma na revizi elektro a na hasicí přístroje (zadání kap. „Seed"). */
const REVIZE_ELEKTRO_A: DemoContract = {
  supplier: 'revize-elektro-sever',
  subject: 'Revize elektrických zařízení a rozvodů',
  budgetCategory: 'revize',
  monthlyAmount: null,
  covers: ['revize_elektro'],
};

const HASICI_A: DemoContract = {
  supplier: 'hasici-pristroje',
  subject: 'Kontrola a revize hasicích přístrojů',
  budgetCategory: 'revize',
  monthlyAmount: null,
  covers: ['hasici_pristroje'],
};

/** SVJ B a C: smluvní firma na výtahy (obor pokrytý zvlášť od servisní smlouvy s Benešem). */
const VYTAHY_REVIZE: DemoContract = {
  supplier: 'vytahy',
  subject: 'Revize a odborné prohlídky výtahů',
  budgetCategory: 'vytah',
  monthlyAmount: null,
  covers: ['vytahy'],
};

/** SVJ B: smluvní firma na revizi plynu a kominictví. */
const REVIZE_PLYN_KOMINY_B: DemoContract = {
  supplier: 'revize-plyn-kominy',
  subject: 'Revize plynových zařízení a kontrola komínů',
  budgetCategory: 'revize',
  monthlyAmount: null,
  covers: ['revize_plyn', 'kominy'],
};

export {
  REVIZE,
  PLYN,
  INSTALATER,
  STRECHAR,
  REVIZE_ELEKTRO_A,
  HASICI_A,
  VYTAHY_REVIZE,
  REVIZE_PLYN_KOMINY_B,
};
