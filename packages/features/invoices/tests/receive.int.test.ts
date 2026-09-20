import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { DomainError } from '../../../kernel/src/errors/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { InboundMail } from '../adapters/index';
import { getInvoice, listInvoices, receiveInvoiceMail } from '../service/index';
import { auditActions } from './audit.fixture';
import { INVOICE_LINES, sampleInvoicePdf } from './fixtures/sample-invoice.fixture';
import { someSvj, startInvoicesWorld, withTestTenant, type InvoicesWorld } from './world.fixture';

let world: InvoicesWorld;
let ctx: RequestContext;
let svjId: SvjId;
let pdf: Buffer;

beforeAll(async () => {
  world = await startInvoicesWorld();
  ctx = (await withTestTenant()).ctx;
  svjId = someSvj();
  pdf = await sampleInvoicePdf(INVOICE_LINES);
}, 300_000);

afterAll(async () => {
  await world.stop();
});

const mailWith = (attachments: InboundMail['attachments']): InboundMail => ({
  from: 'fakturace@vytahy-praha.test',
  subject: 'Faktura 2026-0042',
  text: 'V příloze zasíláme fakturu za servis výtahu.',
  receivedAt: new Date('2026-09-02T07:30:00.000Z'),
  attachments,
});

const withPdf = (body: Buffer): InboundMail =>
  mailWith([{ filename: 'faktura.pdf', contentType: 'application/pdf', body }]);

describe('receiveInvoiceMail', () => {
  it('files the attachment and opens an invoice on it', async () => {
    const received = await receiveInvoiceMail(ctx, { svjId, mail: withPdf(pdf) });

    await expect(getInvoice(ctx, received.invoiceId)).resolves.toMatchObject({
      status: 'received',
      source: 'email',
      checks: { mail: { from: 'fakturace@vytahy-praha.test', via: 'simulated' } },
    });
    expect(received.duplicateOf).toBeUndefined();
  });

  it('recognises the same file sent a second time and opens nothing', async () => {
    const first = await receiveInvoiceMail(ctx, { svjId, mail: withPdf(pdf) });
    const again = await receiveInvoiceMail(ctx, { svjId, mail: withPdf(pdf) });

    expect(again.duplicateOf).toBe(first.invoiceId);
    expect(await listInvoices(ctx, { svjId })).toHaveLength(1);
    await expect(auditActions(ctx, first.invoiceId)).resolves.toContain('invoice.duplicate_rejected');
  });

  it('refuses a message with no invoice in it', async () => {
    const mail = mailWith([{ filename: 'podpis.png', contentType: 'image/png', body: Buffer.from('x') }]);

    await expect(receiveInvoiceMail(ctx, { svjId, mail })).rejects.toBeInstanceOf(DomainError);
    await expect(receiveInvoiceMail(ctx, { svjId, mail })).rejects.toMatchObject({
      code: 'inbound_no_pdf',
    });
  });

  it('takes a different file from the same sender as a different invoice', async () => {
    const other = await sampleInvoicePdf([...INVOICE_LINES, 'Poznamka: druha faktura']);

    const received = await receiveInvoiceMail(ctx, { svjId, mail: withPdf(other) });

    expect(received.duplicateOf).toBeUndefined();
    expect(await listInvoices(ctx, { svjId })).toHaveLength(2);
  });
});
