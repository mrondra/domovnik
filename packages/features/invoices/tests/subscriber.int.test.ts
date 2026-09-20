import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { queueNameFor } from '../../../kernel/src/events/index';
import { eventIdSchema, newId, tenantIdSchema, type SvjId } from '../../../kernel/src/ids/index';
import { invoiceReceived } from '../domain/events';
import { getInvoice, receiveInvoiceMail } from '../service/index';
import { seedCleaningSupplier, seedTidySvj, useRecordedLlm } from './extraction.fixture';
import { scenarioNamed } from './fixtures/invoice-scenarios.fixture';
import { scenarioPdf } from './fixtures/scenario-pdf.fixture';
import { processReceived } from '../subscribers/process-received';
import { someSvj, startInvoicesWorld, withTestTenant, type InvoicesWorld } from './world.fixture';

let world: InvoicesWorld;
let ctx: RequestContext;
let svjId: SvjId;

beforeAll(async () => {
  world = await startInvoicesWorld();
  useRecordedLlm();
  const tenant = await withTestTenant();
  ctx = tenant.ctx;
  svjId = someSvj();
  await seedTidySvj(ctx, svjId, await seedCleaningSupplier(ctx));
}, 300_000);

afterAll(async () => {
  await world.stop();
});

const deliver = (payload: { invoiceId: string; svjId: string; documentId: string }): Promise<void> =>
  withTenant(ctx, () =>
    processReceived.handler(ctx, {
      eventId: newId(eventIdSchema),
      name: invoiceReceived.name,
      version: invoiceReceived.version,
      payload,
      tenantId: tenantIdSchema.parse(ctx.tenantId),
      correlationId: ctx.correlationId,
    }),
  );

describe('the subscriber on finance.invoice.received', () => {
  it('is registered under a queue named after the event and the subscriber', () => {
    expect(processReceived.queue).toBe(queueNameFor('finance.invoice.received', 'invoices.process-received'));
  });

  it('takes an invoice from received all the way to extracted', async () => {
    const one = scenarioNamed('as-agreed');
    const received = await receiveInvoiceMail(ctx, {
      svjId,
      mail: {
        from: 'fakturace@uklid-praha.test',
        subject: 'Faktura 2026-0101',
        text: 'V příloze.',
        receivedAt: new Date('2026-09-02T07:30:00.000Z'),
        attachments: [
          { filename: 'faktura.pdf', contentType: 'application/pdf', body: await scenarioPdf(one) },
        ],
      },
    });

    const invoice = await getInvoice(ctx, received.invoiceId);
    expect(invoice.status).toBe('received');

    await deliver({
      invoiceId: received.invoiceId,
      svjId,
      documentId: invoice.documentId,
    });

    await expect(getInvoice(ctx, received.invoiceId)).resolves.toMatchObject({
      status: 'extracted',
      externalNumber: '2026-0101',
    });
  });
});
