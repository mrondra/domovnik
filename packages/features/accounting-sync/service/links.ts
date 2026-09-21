import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import { newRowId, type SvjId } from '../../../kernel/src/ids/index';
import { accountingLink } from '../schema/index';
import type { AccountingLink, AccountingAdapterKind, ReceivablesAdapterKind } from '../domain/types';

const jsonObject = z.record(z.string(), z.unknown()).nullable();

export interface LinkSvjInput {
  readonly svjId: SvjId;
  readonly companyIco: string;
  readonly accountingAdapter?: AccountingAdapterKind | undefined;
  readonly receivablesAdapter?: ReceivablesAdapterKind | undefined;
  readonly config?: Readonly<Record<string, unknown>> | undefined;
}

/**
 * Which accounting unit an SVJ is, and which implementations serve it. Idempotent by SVJ: a house
 * has one link, and setting it again is a correction rather than a second one (task 024).
 */
export const linkSvj = (ctx: RequestContext, input: LinkSvjInput): Promise<void> =>
  withTenant(ctx, async (tx) => {
    const values = {
      accountingAdapter: input.accountingAdapter ?? ('mock' as const),
      receivablesAdapter: input.receivablesAdapter ?? ('internal' as const),
      companyIco: input.companyIco,
      config: input.config ?? null,
    };

    await tx
      .insert(accountingLink)
      .values({
        ...values,
        id: newRowId(),
        tenantId: ctx.tenantId,
        svjId: input.svjId,
        createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
      })
      .onConflictDoUpdate({ target: [accountingLink.tenantId, accountingLink.svjId], set: values });

    await audit.record(ctx, {
      action: 'accounting.link.set',
      entity: 'accounting_link',
      reason: `SVJ napojeno na účetní jednotku ${input.companyIco}`,
      after: { svjId: input.svjId, ...values },
    });
  });

export const linkOf = (ctx: RequestContext, svjId: SvjId): Promise<AccountingLink | null> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select().from(accountingLink).where(eq(accountingLink.svjId, svjId)).limit(1);

    const row = rows[0];
    return row === undefined
      ? null
      : {
          svjId,
          accountingAdapter: row.accountingAdapter,
          receivablesAdapter: row.receivablesAdapter,
          companyIco: row.companyIco,
          lastSyncAt: row.lastSyncAt,
          config: jsonObject.parse(row.config),
        };
  });

export const requireLink = async (ctx: RequestContext, svjId: SvjId): Promise<AccountingLink> => {
  const found = await linkOf(ctx, svjId);
  if (found !== null) return found;

  throw new NotFoundError('SVJ nemá napojenou účetní jednotku', {
    code: 'accounting_link_missing',
    details: { svjId },
  });
};
