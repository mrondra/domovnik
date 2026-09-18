import { and, asc, eq, gte, isNull, lte, or } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { newId, type SvjId } from '../../../kernel/src/ids/index';
import { asDay, type IsoDay } from '../domain/day';
import { contractIdSchema, type SupplierId } from '../domain/ids';
import type { BudgetCategory, Contract } from '../domain/types';
import { contract } from '../schema/index';
import { assertReachable } from './reach';
import { asMoney, toContract } from './rows';

export interface CreateContractInput {
  readonly svjId: SvjId;
  readonly supplierId: SupplierId;
  readonly subject: string;
  readonly budgetCategory: BudgetCategory;
  readonly monthlyAmount?: number | undefined;
  readonly validFrom: IsoDay;
  readonly validTo?: IsoDay | undefined;
  readonly documentId?: string | undefined;
}

export interface ContractsForSupplierInput {
  readonly svjId: SvjId;
  readonly supplierId: SupplierId;
  /** The day the invoice is about; a contract that had ended by then is not the one that applies. */
  readonly on: Date;
}

export const createContract = (ctx: RequestContext, input: CreateContractInput): Promise<Contract> => {
  const created: Contract = {
    id: newId(contractIdSchema),
    svjId: input.svjId,
    supplierId: input.supplierId,
    subject: input.subject,
    budgetCategory: input.budgetCategory,
    monthlyAmount: input.monthlyAmount ?? null,
    validFrom: input.validFrom,
    validTo: input.validTo ?? null,
    documentId: input.documentId ?? null,
  };

  return withTenant(ctx, async (tx) => {
    await assertReachable(ctx, input.svjId);
    await tx.insert(contract).values({
      ...created,
      monthlyAmount: created.monthlyAmount === null ? null : asMoney(created.monthlyAmount),
      tenantId: ctx.tenantId,
      createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
    });

    await audit.record(ctx, {
      action: 'finance.contract.created',
      entity: 'contract',
      entityId: created.id,
      reason: 'Založena smlouva',
      after: { subject: created.subject, budgetCategory: created.budgetCategory },
    });

    return created;
  });
};

/**
 * The contracts of one SVJ with one supplier that were in force on a given day. An invoice is
 * matched against these, so an expired contract must not be among them — the supplier is the same
 * company either way, and the difference is exactly what the dates say (task 016).
 */
export const findContractsForSupplier = (
  ctx: RequestContext,
  input: ContractsForSupplierInput,
): Promise<readonly Contract[]> =>
  withTenant(ctx, async (tx) => {
    await assertReachable(ctx, input.svjId);
    const on = asDay(input.on);

    const rows = await tx
      .select()
      .from(contract)
      .where(
        and(
          eq(contract.svjId, input.svjId),
          eq(contract.supplierId, input.supplierId),
          lte(contract.validFrom, on),
          or(isNull(contract.validTo), gte(contract.validTo, on)),
        ),
      )
      .orderBy(asc(contract.validFrom));

    return rows.map(toContract);
  });
