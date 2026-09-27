import { buffer as readToEnd } from 'node:stream/consumers';
import { z } from 'zod';
import { defineScenarioKind, type ScenarioResult } from '../../demo/index';
import { svjIdSchema } from '../../../kernel/src/ids/index';
import { getObject, storageKeySchema } from '../../../kernel/src/storage/index';
import { receiveInvoiceMail } from '../service/index';

const FILENAME = 'faktura.pdf';

/** An invoice arriving by e-mail: the file is already in storage, the message is made up here. */
const inboundInvoicePayloadSchema = z.object({
  storageKey: z.string().min(1),
  svjId: z.uuid(),
  from: z.string().min(1),
  subject: z.string().min(1),
});

/**
 * The invoice arrives exactly as a real one would: the file is read out of storage, wrapped in a
 * message and handed to `receiveInvoiceMail`. Nothing about the path afterwards knows it was a
 * demonstration, which is the point of having the scenario write a file rather than a row.
 */
export const inboundInvoiceScenario = defineScenarioKind({
  kind: 'inbound_invoice',
  feature: 'invoices',
  payload: inboundInvoicePayloadSchema,
  run: async (ctx, code, mail): Promise<ScenarioResult> => {
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
          link: { label: 'Otevřít fakturu', path: `/invoices/${received.invoiceId}` },
        }
      : {
          code,
          outcome: 'duplicate',
          message: 'Stejný soubor už je založený; nová faktura nevznikla.',
          link: { label: 'Otevřít fakturu', path: `/invoices/${received.duplicateOf}` },
        };
  },
});
