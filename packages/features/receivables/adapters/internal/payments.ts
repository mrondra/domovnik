import type { RequestContext } from '../../../../kernel/src/context/index';
import { withTenant } from '../../../../kernel/src/db/index';
import { newRowId } from '../../../../kernel/src/ids/index';
import { unitBalanceEntry } from '../../schema';
import type { RecordPaymentInput } from '../receivables.adapter';
import { asMoney } from './rows';

/**
 * A payment is one more line in the ledger of the unit, never an update of a prescription: the
 * prescription is what was asked for and does not change because money arrived (task 012).
 */
export const recordPayment = (ctx: RequestContext, input: RecordPaymentInput): Promise<void> =>
  withTenant(ctx, async (tx) => {
    await tx.insert(unitBalanceEntry).values({
      id: newRowId(),
      tenantId: ctx.tenantId,
      svjId: input.svjId,
      createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
      unitId: input.unitId,
      entryDate: input.paidOn,
      kind: 'payment',
      amount: asMoney(input.amount),
      referenceType: input.reference.type,
      referenceId: input.reference.id,
    });
  });
