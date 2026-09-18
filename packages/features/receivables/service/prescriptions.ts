import { audit } from '../../../kernel/src/audit/index';
import { withSvj, type RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { events } from '../../../kernel/src/events/index';
import {
  generatingAdapterFor,
  receivablesAdapterFor,
  type FindByVariableSymbolInput,
  type GeneratePrescriptionsInput,
  type ListPrescriptionsInput,
} from '../adapters/index';
import { prescriptionsGenerated } from '../domain/events';
import { formatPeriod } from '../domain/period';
import { prescriptionPlanSchema } from '../domain/schemas';
import type { Prescription } from '../domain/types';
import { assertReachable } from './reach';

/**
 * Raising a month of prescriptions is one transaction: the rows, the ledger entries, the audit row
 * and the event either all happen or none do. Running it again for the same month adds nothing, and
 * then there is nothing to announce either.
 */
export const generatePrescriptions = (
  ctx: RequestContext,
  input: GeneratePrescriptionsInput,
): Promise<readonly Prescription[]> =>
  withTenant(ctx, async () => {
    await assertReachable(ctx, input.svjId);
    prescriptionPlanSchema.parse(input.plan);
    const adapter = await generatingAdapterFor(ctx, input.svjId);
    const created = await adapter.generatePrescriptions(ctx, input);
    if (created.length === 0) return created;

    await audit.record(ctx, {
      action: 'finance.prescription.generated',
      entity: 'prescription',
      reason: `Vygenerovány předpisy na ${formatPeriod(input.period)}`,
      after: { svjId: input.svjId, period: formatPeriod(input.period), count: created.length },
    });

    await events.emit(
      withSvj(ctx, input.svjId),
      prescriptionsGenerated.create({
        svjId: input.svjId,
        period: input.period,
        count: created.length,
      }),
    );

    return created;
  });

export const listPrescriptions = async (
  ctx: RequestContext,
  input: ListPrescriptionsInput,
): Promise<readonly Prescription[]> => {
  await assertReachable(ctx, input.svjId);
  return (await receivablesAdapterFor(ctx, input.svjId)).listPrescriptions(ctx, input);
};

/** What `payments` (020) matches a bank transfer against. */
export const findByVariableSymbol = async (
  ctx: RequestContext,
  input: FindByVariableSymbolInput,
): Promise<Prescription | null> => {
  await assertReachable(ctx, input.svjId);
  return (await receivablesAdapterFor(ctx, input.svjId)).findByVariableSymbol(ctx, input);
};
