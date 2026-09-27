import { withChecksum } from './ico';

export interface DemoSender {
  readonly name: string;
  readonly ico: string;
  readonly bankAccount: string;
  readonly email: string;
}

/**
 * What a demo scenario's PDF names as the sender, for the three suppliers a scenario ever refers to
 * by code. The address book itself is seeded by `packages/features/suppliers` (task 029, ADR 0023);
 * a scenario needs the same name/IČO/account only to render a realistic invoice, not to look the
 * supplier up, so it keeps its own small copy rather than reaching into that feature's seed data.
 */
const SENDERS: Readonly<Record<string, DemoSender>> = {
  uklid: {
    name: 'Čisté domy s.r.o.',
    ico: withChecksum('2713045'),
    bankAccount: '2801234567/2010',
    email: 'fakturace@ciste-domy.demo.test',
  },
  vytahy: {
    name: 'Výtahy Beneš a syn s.r.o.',
    ico: withChecksum('2648812'),
    bankAccount: '2901234568/2010',
    email: 'fakturace@vytahy-benes.demo.test',
  },
  strechar: {
    name: 'Střechy Novotný s.r.o.',
    ico: withChecksum('2777054'),
    bankAccount: '3201234571/2010',
    email: 'zakazky@strechy-novotny.demo.test',
  },
};

export const senderNamed = (code: string): DemoSender => {
  const found = SENDERS[code];
  if (found === undefined) throw new RangeError(`Scénář nezná odesílatele ${code}`);
  return found;
};
