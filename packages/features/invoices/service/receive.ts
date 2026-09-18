import { createHash } from 'node:crypto';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { DomainError } from '../../../kernel/src/errors/index';
import { newId, type SvjId } from '../../../kernel/src/ids/index';
import { findBySha256, storeDocument } from '../../documents/index';
import { inboundMailAdapter, type InboundAttachment, type InboundMail } from '../adapters/index';
import { invoiceIdSchema, type InvoiceId } from '../domain/ids';
import { createInvoice } from './invoice-records';
import { invoiceOfDocument } from './invoice-lookups';

export interface ReceiveInvoiceMailInput {
  readonly svjId: SvjId;
  readonly mail: InboundMail;
}

export interface ReceivedInvoice {
  readonly invoiceId: InvoiceId;
  /** Set when this exact file had already been filed; then no second invoice was created. */
  readonly duplicateOf?: InvoiceId | undefined;
}

const PDF = 'application/pdf';

const pdfOf = (mail: InboundMail): InboundAttachment => {
  const found = mail.attachments.find((one) => one.contentType === PDF);
  if (found !== undefined) return found;

  throw new DomainError('E-mail neobsahuje přílohu s fakturou v PDF', {
    code: 'inbound_no_pdf',
    details: { from: mail.from, subject: mail.subject },
  });
};

/**
 * What an invoice remembers about the message it came in: who sent it and what it said it was. It
 * is the first thing in `checks`, before any rule has run, so the provenance of the file survives
 * even if nothing else about the invoice could be worked out (task 015).
 */
const provenance = (mail: InboundMail): Record<string, unknown> => ({
  mail: { from: mail.from, subject: mail.subject, via: inboundMailAdapter().kind },
});

const HASH_IN_REASON = 12;

/** The same file under the same SVJ, already filed as an invoice — and the invoice it opened. */
const alreadyFiled = async (
  ctx: RequestContext,
  input: ReceiveInvoiceMailInput,
  sha256: string,
): Promise<InvoiceId | null> => {
  const filed = await findBySha256(ctx, { svjId: input.svjId, sha256 });
  if (filed?.category !== 'invoice') return null;
  return invoiceOfDocument(ctx, filed.id);
};

/**
 * The same path a real IMAP message would take: take the PDF, recognise a file we already have,
 * otherwise file it and open an invoice on it. No model is involved — reading the invoice is task
 * 016, and this step has to be repeatable to the byte.
 */
export const receiveInvoiceMail = (
  ctx: RequestContext,
  input: ReceiveInvoiceMailInput,
): Promise<ReceivedInvoice> =>
  withTenant(ctx, async () => {
    const attachment = pdfOf(input.mail);
    const sha256 = createHash('sha256').update(attachment.body).digest('hex');

    const duplicateOf = await alreadyFiled(ctx, input, sha256);
    if (duplicateOf !== null) {
      await audit.record(ctx, {
        action: 'invoice.duplicate_rejected',
        entity: 'invoice',
        entityId: duplicateOf,
        reason: `Stejný soubor už je založený (${sha256.slice(0, HASH_IN_REASON)})`,
        after: { from: input.mail.from, subject: input.mail.subject },
      });
      return { invoiceId: duplicateOf, duplicateOf };
    }

    const invoiceId = newId(invoiceIdSchema);
    const document = await storeDocument(ctx, {
      svjId: input.svjId,
      title: input.mail.subject,
      category: 'invoice',
      body: attachment.body,
      contentType: attachment.contentType,
      source: 'email',
      filename: attachment.filename,
      linkedEntity: { type: 'invoice', id: invoiceId },
    });

    const created = await createInvoice(ctx, {
      id: invoiceId,
      svjId: input.svjId,
      documentId: document.id,
      source: 'email',
      receivedAt: input.mail.receivedAt,
      checks: provenance(input.mail),
    });

    return { invoiceId: created.id };
  });
