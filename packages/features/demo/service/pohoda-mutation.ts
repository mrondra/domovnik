import type { RequestContext } from '../../../kernel/src/context/index';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { detectConflicts, listConflicts, pohodaMock } from '../../accounting-sync/index';
import { listInvoices } from '../../invoices/index';
import { pohodaMutationPayloadSchema, type ScenarioResult } from '../domain/types';

const NOTHING = 'V tomhle SVJ není žádná faktura zapsaná v účetnictví, takže není co měnit.';

/**
 * The accountant opens Pohoda and changes the amount of an invoice the platform posted there. It
 * is the one thing a demonstration cannot do from inside the application, so the scenario reaches
 * for the mock's admin door — and everything after it is the ordinary daily comparison (task 025).
 */
export const runPohodaMutation = async (
  ctx: RequestContext,
  code: string,
  payload: unknown,
): Promise<ScenarioResult> => {
  const asked = pohodaMutationPayloadSchema.parse(payload);
  const svjId = svjIdSchema.parse(asked.svjId);

  const posted = await listInvoices(ctx, { svjId, status: 'posted' });
  const invoice = posted.find((one) => one.accountingRef !== null && one.amountTotal !== null);
  if (invoice?.accountingRef == null || invoice.amountTotal === null) {
    return { code, outcome: 'conflict', message: NOTHING, invoiceId: null };
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
    invoiceId: invoice.id,
  };
};
