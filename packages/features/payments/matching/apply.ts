import { eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import { withSvj, type RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { events } from '../../../kernel/src/events/index';
import { newRowId } from '../../../kernel/src/ids/index';
import { invoiceIdSchema, transition } from '../../invoices/index';
import { recordPayment } from '../../receivables/index';
import { unitIdSchema } from '../../svj/index';
import { paymentMatched } from '../domain/events';
import type { BankTransaction } from '../domain/types';
import { bankTransaction, paymentMatch } from '../schema';
import type { MatchDecision } from './rules';

type Matched = Extract<MatchDecision, { kind: 'matched' }>;

/** Who paid, when the payment was for a prescription. An invoice has nobody on the other side. */
export type Payer = { readonly unitId: string } | null;

/**
 * The prescription this payment covers is settled where prescriptions live, and the invoice this
 * payment settles is moved where invoices live. `payments` records that the movement was decided
 * about; what the decision means is each feature's own business (docs/engineering.md §2).
 */
const settle = async (
  ctx: RequestContext,
  movement: BankTransaction,
  decision: Matched,
  payer: Payer,
): Promise<void> => {
  if (decision.targetType === 'prescription' && payer !== null) {
    await recordPayment(ctx, {
      svjId: movement.svjId,
      unitId: unitIdSchema.parse(payer.unitId),
      amount: decision.amount,
      paidOn: movement.bookedOn,
      reference: { type: 'bank_transaction', id: movement.id },
    });
    return;
  }

  await transition(ctx, invoiceIdSchema.parse(decision.targetId), 'paid', {
    reason: `Uhrazeno bankovním převodem ${movement.externalId}`,
  });
};

/** Writes down what was decided and tells the rest of the platform, in the caller's transaction. */
export const applyMatch = (
  ctx: RequestContext,
  movement: BankTransaction,
  decision: Matched,
  payer: Payer,
): Promise<void> =>
  withTenant(ctx, async (tx) => {
    await tx.insert(paymentMatch).values({
      id: newRowId(),
      tenantId: ctx.tenantId,
      svjId: movement.svjId,
      createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
      transactionId: movement.id,
      targetType: decision.targetType,
      targetId: decision.targetId,
      amount: decision.amount.toFixed(2),
      method: decision.method,
      confidence: decision.confidence.toFixed(2),
    });

    await tx
      .update(bankTransaction)
      .set({ matchStatus: 'matched', updatedAt: new Date() })
      .where(eq(bankTransaction.id, movement.id));

    await settle(ctx, movement, decision, payer);

    await audit.record(ctx, {
      action: 'payment.matched',
      entity: 'bank_transaction',
      entityId: movement.id,
      reason: `Pohyb spárován pravidlem ${decision.method}`,
      after: { targetType: decision.targetType, targetId: decision.targetId },
    });

    await events.emit(
      withSvj(ctx, movement.svjId),
      paymentMatched.create({
        svjId: movement.svjId,
        transactionId: movement.id,
        targetType: decision.targetType,
        targetId: decision.targetId,
        method: decision.method,
        amount: decision.amount,
        bookedOn: movement.bookedOn,
      }),
    );
  });
