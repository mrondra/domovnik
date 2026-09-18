import { and, eq, gte, inArray, lte, sum } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { newId, type SvjId } from '../../../kernel/src/ids/index';
import { firstDayOf, lastDayOf } from '../domain/day';
import { budgetLineIdSchema } from '../domain/ids';
import type { InvoiceStatus } from '../domain/status';
import type { BudgetCategory, BudgetStatus } from '../domain/types';
import { budgetLine, invoice } from '../schema/index';
import { assertReachable } from './reach';
import { asMoney } from './rows';

export interface BudgetLineInput {
  readonly svjId: SvjId;
  readonly year: number;
  readonly category: BudgetCategory;
  readonly plannedAmount: number;
}

export type BudgetQuery = Omit<BudgetLineInput, 'plannedAmount'>;

/** Money is spent once the SVJ has agreed to pay it; what happens in Pohoda afterwards follows. */
const COUNTS_AS_SPENT: readonly InvoiceStatus[] = ['approved', 'posted', 'paid'];

/** Idempotent by `(tenant, svj, year, category)`: planning the same line again is a correction. */
export const setBudgetLine = (ctx: RequestContext, input: BudgetLineInput): Promise<void> =>
  withTenant(ctx, async (tx) => {
    await assertReachable(ctx, input.svjId);

    await tx
      .insert(budgetLine)
      .values({
        id: newId(budgetLineIdSchema),
        tenantId: ctx.tenantId,
        svjId: input.svjId,
        createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
        year: input.year,
        category: input.category,
        plannedAmount: asMoney(input.plannedAmount),
      })
      .onConflictDoUpdate({
        target: [budgetLine.tenantId, budgetLine.svjId, budgetLine.year, budgetLine.category],
        set: { plannedAmount: asMoney(input.plannedAmount) },
      });

    await audit.record(ctx, {
      action: 'finance.budget.planned',
      entity: 'budget_line',
      reason: `Rozpočet ${String(input.year)} / ${input.category}`,
      after: { svjId: input.svjId, plannedAmount: input.plannedAmount },
    });
  });

const plannedOf = (ctx: RequestContext, query: BudgetQuery): Promise<number> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({ planned: budgetLine.plannedAmount })
      .from(budgetLine)
      .where(
        and(
          eq(budgetLine.svjId, query.svjId),
          eq(budgetLine.year, query.year),
          eq(budgetLine.category, query.category),
        ),
      )
      .limit(1);

    return Number(rows[0]?.planned ?? 0);
  });

/** The year of an invoice is the day it was issued on; one that has not been read yet has none. */
const spentOf = (ctx: RequestContext, query: BudgetQuery): Promise<number> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({ spent: sum(invoice.amountTotal) })
      .from(invoice)
      .where(
        and(
          eq(invoice.svjId, query.svjId),
          eq(invoice.budgetCategory, query.category),
          inArray(invoice.status, [...COUNTS_AS_SPENT]),
          gte(invoice.issuedOn, firstDayOf(query.year)),
          lte(invoice.issuedOn, lastDayOf(query.year)),
        ),
      );

    return Number(rows[0]?.spent ?? 0);
  });

export const budgetStatus = async (ctx: RequestContext, query: BudgetQuery): Promise<BudgetStatus> => {
  await assertReachable(ctx, query.svjId);
  const [planned, spent] = await Promise.all([plannedOf(ctx, query), spentOf(ctx, query)]);

  return { ...query, planned, spent, remaining: planned - spent };
};
