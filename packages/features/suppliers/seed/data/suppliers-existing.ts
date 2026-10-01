import type { DemoSupplier } from './supplier-shape';
import { withChecksum } from './ico';

/** Task 029's address book, with obory added for the supplier feature (task 030). */
export const DEMO_SUPPLIERS_EXISTING: readonly DemoSupplier[] = [
  {
    code: 'uklid',
    name: 'Čisté domy s.r.o.',
    ico: withChecksum('2713045'),
    bankAccount: '2801234567/2010',
    email: 'fakturace@ciste-domy.demo.test',
    specializations: ['uklid'],
  },
  {
    code: 'vytahy',
    name: 'Výtahy Beneš a syn s.r.o.',
    ico: withChecksum('2648812'),
    bankAccount: '2901234568/2010',
    email: 'fakturace@vytahy-benes.demo.test',
    specializations: ['vytahy'],
  },
  {
    code: 'elektrina',
    name: 'Energie Morava a.s.',
    ico: withChecksum('4519307'),
    bankAccount: '123456789/0800',
    email: 'faktury@energie-morava.demo.test',
    specializations: ['energie'],
  },
  {
    code: 'plyn',
    name: 'Plyn Čechy a.s.',
    ico: withChecksum('4990221'),
    bankAccount: '223456789/0800',
    email: 'faktury@plyn-cechy.demo.test',
    specializations: ['energie'],
  },
  {
    code: 'revize',
    name: 'Revize Hradec s.r.o.',
    ico: withChecksum('2830119'),
    bankAccount: '3001234569/2010',
    email: 'revize@revize-hradec.demo.test',
    specializations: ['revize_elektro', 'revize_plyn', 'hasici_pristroje'],
  },
  {
    code: 'pojisteni',
    name: 'Pojišťovna Vltava a.s.',
    ico: withChecksum('4711620'),
    bankAccount: '333456789/0300',
    email: 'pojisteni@vltava.demo.test',
    specializations: ['pojisteni'],
  },
  {
    code: 'instalater',
    name: 'Instalatérství Dvořák s.r.o.',
    ico: withChecksum('2915438'),
    bankAccount: '3101234570/2010',
    email: 'dvorak@instalater-dvorak.demo.test',
    specializations: ['instalater'],
  },
  {
    code: 'strechar',
    name: 'Střechy Novotný s.r.o.',
    ico: withChecksum('2777054'),
    bankAccount: '3201234571/2010',
    email: 'zakazky@strechy-novotny.demo.test',
    specializations: ['strechy'],
  },
];
