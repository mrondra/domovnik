import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { putObject, storageKeyFor } from '../../../kernel/src/storage/index';
import { registerScenario } from '../../demo/index';
import { DEMO_SCENARIOS } from './data/invoices';
import type { DemoScenario } from './data/scenario-shape';
import { supplierNamed } from './data/suppliers';
import { invoicePdf } from './pdf/invoice-pdf';

/** The key prefix the demo files live under; nothing else writes into it (kernel `storageKeyFor`). */
const AREA = 'demo';

const senderOf = (
  scenario: DemoScenario,
): { name: string; ico: string; bankAccount: string; email: string } => {
  if (scenario.strangerSupplier !== undefined) {
    return { ...scenario.strangerSupplier, email: 'fakturace@zeleny-dum.demo.test' };
  }
  const known = supplierNamed(scenario.supplier ?? '');
  return { name: known.name, ico: known.ico, bankAccount: known.bankAccount, email: known.email };
};

const pdfFor = (scenario: DemoScenario, customer: string): Promise<Buffer> => {
  const sender = senderOf(scenario);
  return invoicePdf({
    ...scenario.invoice,
    supplierName: sender.name,
    supplierIco: sender.ico,
    bankAccount: sender.bankAccount,
    customer,
  });
};

/**
 * Every scenario writes its invoice into object storage and a row saying where it is. The file is
 * what a real message would have carried, so running the scenario later is the real path and not a
 * shortcut through it (task 019).
 *
 * A scenario that repeats another one stores no file of its own: what makes it a duplicate is that
 * it is byte for byte the same, and generating a second copy would defeat the point.
 */
const storeInvoice = async (
  ctx: RequestContext,
  source: string,
  fallback: DemoScenario,
  customer: string,
): Promise<string> => {
  const original = DEMO_SCENARIOS.find((one) => one.code === source) ?? fallback;
  const stored = await putObject(
    ctx,
    storageKeyFor(ctx, AREA, `${source}.pdf`),
    await pdfFor(original, customer),
    'application/pdf',
  );
  return stored.key;
};

/**
 * Idempotent by the key, not by what is already there: the object key and the scenario code are
 * both derived from the scenario, so a second run overwrites the same file and updates the same
 * row. That matters — a demonstration seeded months ago would otherwise keep a file the generator
 * has since improved, and the recorded extraction answers would no longer be about it (task 026).
 */
export const seedScenarios = async (
  ctx: RequestContext,
  houses: readonly { readonly id: SvjId; readonly name: string }[],
): Promise<void> => {
  const storedKeys = new Map<string, string>();

  for (const scenario of DEMO_SCENARIOS) {
    const house = houses[scenario.house];
    if (house === undefined) continue;

    const source = scenario.repeats ?? scenario.code;
    const key = storedKeys.get(source) ?? (await storeInvoice(ctx, source, scenario, house.name));
    storedKeys.set(source, key);

    await registerScenario(ctx, {
      code: scenario.code,
      title: scenario.title,
      description: scenario.description,
      kind: 'inbound_invoice',
      payload: {
        storageKey: key,
        svjId: house.id,
        from: senderOf(scenario).email,
        subject: scenario.subject,
      },
    });
  }
};
