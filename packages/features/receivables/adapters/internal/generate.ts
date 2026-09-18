import type { RequestContext } from '../../../../kernel/src/context/index';
import { withTenant } from '../../../../kernel/src/db/index';
import { newRowId } from '../../../../kernel/src/ids/index';
import { SvjService, type Unit } from '../../../svj/index';
import { applyPlan, type PlannedPrescription } from '../../domain/plan';
import { dueDateOf } from '../../domain/period';
import type { Prescription } from '../../domain/types';
import { variableSymbolsFor } from '../../service/vs';
import { prescription, prescriptionItem, unitBalanceEntry } from '../../schema';
import type { GeneratePrescriptionsInput } from '../receivables.adapter';
import { withItems } from './prescriptions';
import { asMoney } from './rows';

/** `svj` hands its units out through the injectable class only, and that class holds no state. */
const units = new SvjService();

interface Planned {
  readonly unit: Unit;
  readonly planned: PlannedPrescription;
  readonly variableSymbol: string;
}

const planFor = async (ctx: RequestContext, input: GeneratePrescriptionsInput): Promise<Planned[]> => {
  const found = await units.listUnits(ctx, input.svjId);
  const symbols = await variableSymbolsFor(
    ctx,
    input.svjId,
    found.map((unit) => unit.number),
  );

  return found.map((unit, index) => ({
    unit,
    planned: applyPlan(input.plan, { floorArea: unit.floorArea, kind: unit.kind }),
    variableSymbol: symbols[index] ?? '',
  }));
};

/**
 * Raises the prescriptions of one month from the units of the SVJ and the rates in the plan, and
 * the ledger entry that goes with each. Running it twice for the same month adds nothing: the
 * unique index on `(tenant, svj, unit, year, month)` is what makes that true, so a retried job or a
 * second click cannot double-charge anyone.
 */
export const generatePrescriptions = (
  ctx: RequestContext,
  input: GeneratePrescriptionsInput,
): Promise<readonly Prescription[]> =>
  withTenant(ctx, async (tx) => {
    const planned = await planFor(ctx, input);
    if (planned.length === 0) return [];

    const dueDate = dueDateOf(input.period, input.plan.dueDayOfMonth);
    const common = {
      tenantId: ctx.tenantId,
      svjId: input.svjId,
      createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
    };

    const created = await tx
      .insert(prescription)
      .values(
        planned.map((one) => ({
          ...common,
          id: newRowId(),
          unitId: one.unit.id,
          year: input.period.year,
          month: input.period.month,
          variableSymbol: one.variableSymbol,
          totalAmount: asMoney(one.planned.total),
          dueDate,
          source: 'internal' as const,
        })),
      )
      .onConflictDoNothing()
      .returning();

    if (created.length === 0) return [];

    const byUnit = new Map(planned.map((one) => [String(one.unit.id), one.planned]));
    await tx.insert(prescriptionItem).values(
      created.flatMap((row) =>
        (byUnit.get(row.unitId)?.items ?? []).map((item) => ({
          ...common,
          id: newRowId(),
          prescriptionId: row.id,
          code: item.code,
          label: item.label,
          amount: asMoney(item.amount),
        })),
      ),
    );

    await tx.insert(unitBalanceEntry).values(
      created.map((row) => ({
        ...common,
        id: newRowId(),
        unitId: row.unitId,
        entryDate: row.dueDate,
        kind: 'prescription' as const,
        amount: asMoney(-Number(row.totalAmount)),
        referenceType: 'prescription',
        referenceId: row.id,
      })),
    );

    return withItems(ctx, created);
  });
