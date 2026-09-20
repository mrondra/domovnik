import { buffer as readToEnd } from 'node:stream/consumers';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { getObject, storageKeySchema } from '../../../kernel/src/storage/index';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { receiveInvoiceMail } from '../../invoices/index';
import { inboundInvoicePayloadSchema, type ScenarioResult } from '../domain/types';
import { scenarioPayload } from './registry';

const FILENAME = 'faktura.pdf';

/**
 * The invoice arrives exactly as a real one would: the file is read out of storage, wrapped in a
 * message and handed to `receiveInvoiceMail`. Nothing about the path afterwards knows it was a
 * demonstration, which is the point of having the scenario write a file rather than a row.
 */
const deliverInvoice = async (
  ctx: RequestContext,
  code: string,
  payload: unknown,
): Promise<ScenarioResult> => {
  const mail = inboundInvoicePayloadSchema.parse(payload);
  const object = await getObject(ctx, storageKeySchema.parse(mail.storageKey));

  const received = await receiveInvoiceMail(ctx, {
    svjId: svjIdSchema.parse(mail.svjId),
    mail: {
      from: mail.from,
      subject: mail.subject,
      text: 'V příloze zasíláme fakturu.',
      receivedAt: new Date(),
      attachments: [
        { filename: FILENAME, contentType: 'application/pdf', body: await readToEnd(object.body) },
      ],
    },
  });

  return received.duplicateOf === undefined
    ? {
        code,
        outcome: 'created',
        message: 'Faktura byla doručena a zpracovává se.',
        invoiceId: received.invoiceId,
      }
    : {
        code,
        outcome: 'duplicate',
        message: 'Stejný soubor už je založený; nová faktura nevznikla.',
        invoiceId: received.duplicateOf,
      };
};

/**
 * Runs one scenario. It is audited like anything else a person does — a demonstration that leaves
 * no trace is indistinguishable from data somebody invented (ADR 0011).
 */
export const runScenario = (ctx: RequestContext, code: string): Promise<ScenarioResult> =>
  withTenant(ctx, async () => {
    const result = await deliverInvoice(ctx, code, await scenarioPayload(ctx, code));

    await audit.record(ctx, {
      action: 'demo.scenario.run',
      entity: 'demo_scenario',
      reason: `Spuštěn demo scénář ${code}`,
      after: { code, outcome: result.outcome, invoiceId: result.invoiceId },
    });

    return result;
  });
