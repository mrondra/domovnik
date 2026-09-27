import { z } from 'zod';
import { defineScenarioKind, type ScenarioResult } from '../../demo/index';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { listInvoices } from '../../invoices/index';
import { detectConflicts, listConflicts } from '../service/index';
import { pohodaMock } from '../adapters/index';

/** Somebody changing an invoice in Pohoda itself: which house, and by how much (task 025). */
const pohodaMutationPayloadSchema = z.object({
  svjId: z.uuid(),
  amountChange: z.number(),
});

const NOTHING = 'V tomhle SVJ není žádná faktura zapsaná v účetnictví, takže není co měnit.';

/**
 * The accountant opens Pohoda and changes the amount of an invoice the platform posted there. It
 * is the one thing a demonstration cannot do from inside the application, so the scenario reaches
 * for the mock's admin door — and everything after it is the ordinary daily comparison (task 025).
 */
export const pohodaMutationScenario = defineScenarioKind({
  kind: 'pohoda_mutation',
  feature: 'accounting-sync',
  payload: pohodaMutationPayloadSchema,
  run: async (ctx, code, asked): Promise<ScenarioResult> => {
    const svjId = svjIdSchema.parse(asked.svjId);

    const posted = await listInvoices(ctx, { svjId, status: 'posted' });
    const invoice = posted.find((one) => one.accountingRef !== null && one.amountTotal !== null);
    if (invoice?.accountingRef == null || invoice.amountTotal === null) {
      return { code, outcome: 'conflict', message: NOTHING, link: null };
    }

    await pohodaMock.mutateInvoice(ctx, svjId, invoice.accountingRef, {
      amountTotal: invoice.amountTotal + asked.amountChange,
    });

    const opened = await detectConflicts(ctx, svjId);
    const open = await listConflicts(ctx, svjId, 'open');

    return {
      code,
      outcome: 'conflict',
      message:
        `Účetní změnila v Pohodě částku faktury o ${String(asked.amountChange)} Kč. ` +
        `Porovnání našlo ${String(opened.length)} nový rozdíl, otevřených je celkem ${String(open.length)}.`,
      link: { label: 'Otevřít fakturu', path: `/invoices/${invoice.id}` },
    };
  },
});
