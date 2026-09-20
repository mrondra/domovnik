import { withChecksum } from './ico';
import { dated, withVat, type DemoScenario } from './scenario-shape';

/**
 * The five things the demo is meant to show, in the order they are worth showing them. Each one
 * ends somewhere different on purpose: approved without a remark, approved with one, stopped by
 * the checks, and refused outright (task 019).
 */
export const DEMO_SCENARIOS: readonly DemoScenario[] = [
  {
    code: 'invoice-routine',
    title: 'Běžná měsíční faktura za úklid',
    description:
      'Faktura sedí na smlouvu i na obvyklou částku. Ukazuje celou cestu bez zásahu člověka: ' +
      'přečtení, kontroly bez výhrad a návrh na schválení pro výbor SVJ Kotlářská.',
    house: 0,
    supplier: 'uklid',
    subject: 'Faktura za úklid 09/2026',
    invoice: {
      ...dated('2026-0901', '20260901'),
      lines: [{ description: 'Uklid spolecnych prostor 09/2026', amount: 8500 }],
      ...withVat(8500),
    },
  },
  {
    code: 'invoice-over-budget',
    title: 'Zakázka nad zbytek rozpočtu',
    description:
      'Rekonstrukce střechy za 480 000 Kč u SVJ Na Vyhlídce, kterému už z položky opravy zbývá ' +
      'jen desetina. Ukazuje kontrolu rozpočtu: faktura projde, ale výbor dostane varování.',
    house: 2,
    supplier: 'strechar',
    subject: 'Faktura za rekonstrukci ploche strechy',
    invoice: {
      ...dated('2026-0455', '20260455'),
      lines: [{ description: 'Rekonstrukce ploche strechy - 2. etapa', amount: 480_000 }],
      ...withVat(480_000),
    },
  },
  {
    code: 'invoice-above-contract',
    title: 'Faktura vyšší, než říká smlouva',
    description:
      'Servis výtahů u SVJ Brandlova za 13 230 Kč proti smluvním 9 800 Kč. Ukazuje kontrolu ' +
      'odchylky od smlouvy a to, jak se rozdíl dostane do návrhu pro výbor jako riziko.',
    house: 1,
    supplier: 'vytahy',
    subject: 'Faktura za servis vytahu 09/2026',
    invoice: {
      ...dated('2026-1120', '20261120'),
      lines: [
        { description: 'Servis vytahu 09/2026', amount: 9800 },
        { description: 'Vymena lanoveho vodice mimo smlouvu', amount: 3430 },
      ],
      ...withVat(13_230),
    },
  },
  {
    code: 'invoice-unknown-supplier',
    title: 'Faktura od neznámého dodavatele',
    description:
      'Zahradnické práce, které si u SVJ Kotlářská nikdo neeviduje. Ukazuje, že kontroly umí ' +
      'fakturu zastavit: skončí ve stavu k ověření a agent popíše, co chybí.',
    house: 0,
    strangerSupplier: {
      name: 'Zahradnictvi Zeleny dum s.r.o.',
      ico: withChecksum('2966341'),
      bankAccount: '3301234572/2010',
    },
    subject: 'Faktura za zahradnicke prace',
    invoice: {
      ...dated('2026-0330', '20260330'),
      lines: [{ description: 'Serez zivych plotu a odvoz odpadu', amount: 12_400 }],
      ...withVat(12_400),
    },
  },
  {
    code: 'invoice-duplicate',
    title: 'Tentýž soubor podruhé',
    description:
      'Znovu odeslaná faktura za servis výtahů. Ukazuje rozpoznání duplicity podle otisku ' +
      'souboru: druhá faktura nevznikne a systém odkáže na tu první.',
    house: 1,
    supplier: 'vytahy',
    subject: 'Faktura za servis vytahu 09/2026 (opakovane)',
    repeats: 'invoice-above-contract',
    invoice: {
      ...dated('2026-1120', '20261120'),
      lines: [{ description: 'Servis vytahu 09/2026', amount: 9800 }],
      ...withVat(13_230),
    },
  },
];
