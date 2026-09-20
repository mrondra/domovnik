import { DomainError } from '../../../../kernel/src/errors/index';
import { withChecksum } from './ico';

export interface DemoSupplier {
  /** The stable key the seed upserts by, and what the scenarios refer to. */
  readonly code: string;
  readonly name: string;
  readonly ico: string;
  readonly bankAccount: string;
  readonly email: string;
}

/** Invented companies with a valid IČO check digit; the seed never carries anything real. */
export const DEMO_SUPPLIERS: readonly DemoSupplier[] = [
  {
    code: 'uklid',
    name: 'Čisté domy s.r.o.',
    ico: withChecksum('2713045'),
    bankAccount: '2801234567/2010',
    email: 'fakturace@ciste-domy.demo.test',
  },
  {
    code: 'vytahy',
    name: 'Výtahy Beneš a syn s.r.o.',
    ico: withChecksum('2648812'),
    bankAccount: '2901234568/2010',
    email: 'fakturace@vytahy-benes.demo.test',
  },
  {
    code: 'elektrina',
    name: 'Energie Morava a.s.',
    ico: withChecksum('4519307'),
    bankAccount: '123456789/0800',
    email: 'faktury@energie-morava.demo.test',
  },
  {
    code: 'plyn',
    name: 'Plyn Čechy a.s.',
    ico: withChecksum('4990221'),
    bankAccount: '223456789/0800',
    email: 'faktury@plyn-cechy.demo.test',
  },
  {
    code: 'revize',
    name: 'Revize Hradec s.r.o.',
    ico: withChecksum('2830119'),
    bankAccount: '3001234569/2010',
    email: 'revize@revize-hradec.demo.test',
  },
  {
    code: 'pojisteni',
    name: 'Pojišťovna Vltava a.s.',
    ico: withChecksum('4711620'),
    bankAccount: '333456789/0300',
    email: 'pojisteni@vltava.demo.test',
  },
  {
    code: 'instalater',
    name: 'Instalatérství Dvořák s.r.o.',
    ico: withChecksum('2915438'),
    bankAccount: '3101234570/2010',
    email: 'dvorak@instalater-dvorak.demo.test',
  },
  {
    code: 'strechar',
    name: 'Střechy Novotný s.r.o.',
    ico: withChecksum('2777054'),
    bankAccount: '3201234571/2010',
    email: 'zakazky@strechy-novotny.demo.test',
  },
];

export const supplierNamed = (code: string): DemoSupplier => {
  const found = DEMO_SUPPLIERS.find((one) => one.code === code);
  if (found === undefined) {
    throw new DomainError(`Seed nezná dodavatele ${code}`, {
      code: 'demo_supplier_unknown',
      details: { supplier: code },
    });
  }
  return found;
};
