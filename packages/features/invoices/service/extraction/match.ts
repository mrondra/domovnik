import type { RequestContext } from '../../../../kernel/src/context/index';
import type { SvjId } from '../../../../kernel/src/ids/index';
import type { BudgetCategory, Contract, Supplier } from '../../domain/types';
import { findContractsForSupplier } from '../contracts';
import { findSupplierByIco } from '../suppliers';
import type { ExtractedInvoice } from './schema';

export interface MatchedInvoice {
  readonly supplier: Supplier | null;
  readonly contracts: readonly Contract[];
  /** The category the contract books this supplier under; without a contract there is none yet. */
  readonly budgetCategory: BudgetCategory | null;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The model was asked for `YYYY-MM-DD`; anything else is dropped rather than guessed at. */
export const asIsoDay = (value: string): string | undefined =>
  ISO_DAY.test(value) && !Number.isNaN(Date.parse(value)) ? value : undefined;

/**
 * What the extracted invoice turns out to be about: which supplier it is from, which of that
 * supplier's contracts were in force the day it was issued, and therefore which budget line it
 * belongs to. All of it deterministic — the agent is asked about what is left (ADR 0004).
 */
export const matchInvoice = async (
  ctx: RequestContext,
  svjId: SvjId,
  extracted: ExtractedInvoice,
): Promise<MatchedInvoice> => {
  const supplier = await findSupplierByIco(ctx, extracted.supplierIco);
  if (supplier === null) return { supplier: null, contracts: [], budgetCategory: null };

  const issuedOn = asIsoDay(extracted.issuedOn);
  const contracts = await findContractsForSupplier(ctx, {
    svjId,
    supplierId: supplier.id,
    on: issuedOn === undefined ? new Date() : new Date(`${issuedOn}T00:00:00.000Z`),
  });

  return { supplier, contracts, budgetCategory: contracts[0]?.budgetCategory ?? null };
};
