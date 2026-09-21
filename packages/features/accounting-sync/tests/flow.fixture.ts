import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { eventIdSchema, newId, newRowId, tenantIdSchema } from '../../../kernel/src/ids/index';
import type { EventHandler, DeliveredEvent } from '../../../kernel/src/events/index';
import { InvoicesService, type InvoiceId } from '../../invoices/index';
import { SvjService } from '../../svj/index';
import { linkSvj } from '../service/index';

const invoices = new InvoicesService();
const svj = new SvjService();

let sequence = 0;

export interface LinkedHouse {
  readonly svjId: Parameters<typeof linkSvj>[1]['svjId'];
  readonly ico: string;
}

/** A house booked in the demo's Pohoda; everything this feature does starts from a link. */
export const linkedHouse = async (ctx: RequestContext): Promise<LinkedHouse> => {
  sequence += 1;
  const ico = String(26_500_000 + sequence);
  const created = await svj.createSvj(ctx, {
    name: `SVJ ${String(sequence)}`,
    ico,
    address: { street: 'Krátká 1', city: 'Praha 1', postalCode: '110 00' },
  });

  await linkSvj(ctx, { svjId: created.id, companyIco: ico });
  return { svjId: created.id, ico };
};

export interface ApprovedInvoice {
  readonly id: InvoiceId;
  readonly amountTotal: number;
  readonly dueOn: string;
  readonly variableSymbol: string;
}

const AMOUNT = 12_100;

/** An invoice taken to `approved` the ordinary way, which is where this feature picks it up. */
export const approvedInvoice = async (
  ctx: RequestContext,
  house: LinkedHouse,
  symbol: string,
): Promise<ApprovedInvoice> => {
  sequence += 1;
  const supplier = await invoices.createSupplier(ctx, {
    name: `Výtahy ${String(sequence)} s.r.o.`,
    ico: String(27_000_000 + sequence),
    dic: `CZ${String(27_000_000 + sequence)}`,
  });

  const received = await invoices.createInvoice(ctx, {
    svjId: house.svjId,
    documentId: newRowId(),
    source: 'email',
    receivedAt: new Date('2026-09-01T08:00:00.000Z'),
  });

  await invoices.transition(ctx, received.id, 'extracted', {
    supplierId: supplier.id,
    externalNumber: `F-${symbol}`,
    variableSymbol: symbol,
    issuedOn: '2026-09-01',
    dueOn: '2026-09-30',
    amountTotal: AMOUNT,
    amountVat: 2100,
  });
  await invoices.transition(ctx, received.id, 'pending_approval');
  await invoices.transition(ctx, received.id, 'approved');

  return { id: received.id, amountTotal: AMOUNT, dueOn: '2026-09-30', variableSymbol: symbol };
};

/** Delivering an event by hand, the way `apps/workers` would deliver it off the queue. */
export const deliver = (
  ctx: RequestContext,
  handler: EventHandler,
  event: Pick<DeliveredEvent, 'name' | 'version' | 'payload'>,
): Promise<void> =>
  withTenant(ctx, () =>
    handler(ctx, {
      ...event,
      eventId: newId(eventIdSchema),
      tenantId: tenantIdSchema.parse(ctx.tenantId),
      correlationId: ctx.correlationId,
    }),
  );
