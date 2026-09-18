import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { readModels } from '../../svj/index';
import { variableSymbolFor } from '../domain/vs';

/**
 * The symbols a whole house pays under. They are a property of the SVJ's records, not of where
 * those records are kept: whichever implementation raises the prescription, the payer has to keep
 * using the same six digits. That is why they are decided here, above the adapters, and why
 * `adapters/internal/generate.ts` reaches up for them. The sequence is read once, not per unit.
 */
export const variableSymbolsFor = async (
  ctx: RequestContext,
  svjId: SvjId,
  unitNumbers: readonly string[],
): Promise<readonly string[]> => {
  const sequence = await readModels.svjSequence(ctx, svjId);
  return unitNumbers.map((number) => variableSymbolFor(sequence, number));
};
