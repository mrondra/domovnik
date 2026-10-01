import type { DemoSupplier } from './supplier-shape';
import { withChecksum } from './ico';

/**
 * Task 030's dedicated inspection firms — two on `revize_elektro` (one also does
 * `revize_hromosvod`), one on `revize_plyn` and `kominy`, one on `hasici_pristroje`, a second lift
 * company, and one reachable by phone only (no e-mail — the request-for-quote filter has nobody to
 * send it to).
 */
export const DEMO_SUPPLIERS_NEW: readonly DemoSupplier[] = [
  {
    code: 'revize-elektro-sever',
    name: 'Elektrorevize Sever s.r.o.',
    ico: withChecksum('3011223'),
    bankAccount: '3301234572/2010',
    email: 'elektrorevize-sever@dodavatel.domovnik.test',
    specializations: ['revize_elektro', 'revize_hromosvod'],
    phone: '+420 602 100 201',
  },
  {
    code: 'revize-elektro-jih',
    name: 'Elektrorevize Jih s.r.o.',
    ico: withChecksum('3122456'),
    bankAccount: '3401234573/2010',
    email: 'elektrorevize-jih@dodavatel.domovnik.test',
    specializations: ['revize_elektro'],
    phone: '+420 602 100 202',
  },
  {
    code: 'revize-plyn-kominy',
    name: 'Plynoservis a kominictví Tábor s.r.o.',
    ico: withChecksum('3233567'),
    bankAccount: '3501234574/2010',
    email: 'plynoservis-tabor@dodavatel.domovnik.test',
    specializations: ['revize_plyn', 'kominy'],
    phone: '+420 602 100 203',
  },
  {
    code: 'hasici-pristroje',
    name: 'Hasicí technika Zlín s.r.o.',
    ico: withChecksum('3344678'),
    bankAccount: '3601234575/2010',
    email: 'hasici-technika-zlin@dodavatel.domovnik.test',
    specializations: ['hasici_pristroje'],
    phone: '+420 602 100 204',
  },
  {
    code: 'vytahy-druha',
    name: 'Výtahy Morava s.r.o.',
    ico: withChecksum('3455789'),
    bankAccount: '3701234576/2010',
    email: 'vytahy-morava@dodavatel.domovnik.test',
    specializations: ['vytahy'],
    phone: '+420 602 100 205',
  },
  {
    code: 'revize-elektro-telefon',
    name: 'Elektrorevize Karlík',
    ico: withChecksum('3566890'),
    bankAccount: '3801234577/2010',
    specializations: ['revize_elektro'],
    phone: '+420 602 100 206',
  },
];
