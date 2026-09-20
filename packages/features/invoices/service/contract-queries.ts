import { and, asc, eq, gte, isNull, lte, or } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { asDay } from '../domain/day';
import type { ContractId } from '../domain/ids';
import type { Contract } from '../domain/types';
import { contract } from '../schema/index';
import { assertReachable } from './reach';
import { toContract } from './rows';

/** One contract by id, for a caller that already has the id off an invoice (task 017). */
export const contractById = (ctx: RequestContext, contractId: ContractId): Promise<Contract | null> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select().from(contract).where(eq(contract.id, contractId)).limit(1);
    const row = rows[0];
    if (row === undefined) return null;

    const found = toContract(row);
    await assertReachable(ctx, found.svjId);
    return found;
  });

/** Every contract of one SVJ that is in force today; what the detail screen and the API list. */
export const listContracts = (ctx: RequestContext, svjId: SvjId): Promise<readonly Contract[]> =>
  withTenant(ctx, async (tx) => {
    await assertReachable(ctx, svjId);
    const on = asDay(new Date());

    const rows = await tx
      .select()
      .from(contract)
      .where(
        and(
          eq(contract.svjId, svjId),
          lte(contract.validFrom, on),
          or(isNull(contract.validTo), gte(contract.validTo, on)),
        ),
      )
      .orderBy(asc(contract.subject));

    return rows.map(toContract);
  });
