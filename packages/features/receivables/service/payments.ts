import { audit } from '../../../kernel/src/audit/index';
import { withSvj, type RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { events } from '../../../kernel/src/events/index';
import { receivablesAdapterFor, type RecordPaymentInput } from '../adapters/index';
import { paymentRecorded } from '../domain/events';

/**
 * Money arriving against a unit. The adapter decides where the entry lands — our ledger today, a
 * *likvidace* in Pohoda from 024 — while the audit row and the event are the same either way.
 */
export const recordPayment = (ctx: RequestContext, input: RecordPaymentInput): Promise<void> =>
  withTenant(ctx, async () => {
    const adapter = await receivablesAdapterFor(ctx, input.svjId);
    await adapter.recordPayment(ctx, input);

    await audit.record(ctx, {
      action: 'finance.payment.recorded',
      entity: 'unit_balance_entry',
      entityId: input.reference.id,
      reason: `Zaznamenána platba ${input.reference.type}`,
      after: { unitId: input.unitId, amount: input.amount, paidOn: input.paidOn.toISOString() },
    });

    await events.emit(
      withSvj(ctx, input.svjId),
      paymentRecorded.create({
        svjId: input.svjId,
        unitId: input.unitId,
        amount: input.amount,
        reference: input.reference,
      }),
    );
  });
