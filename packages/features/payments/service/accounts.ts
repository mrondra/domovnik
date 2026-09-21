import { asc, eq } from 'drizzle-orm';
import { audit } from '../../../kernel/src/audit/index';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import { newId, type SvjId } from '../../../kernel/src/ids/index';
import { bankAccountIdSchema, type BankAccountId } from '../domain/ids';
import type { BankAccount } from '../domain/types';
import { bankAccount } from '../schema';
import { assertReachable } from './reach';
import { toBankAccount } from './rows';

export interface CreateBankAccountInput {
  readonly svjId: SvjId;
  readonly number: string;
  readonly bankCode: string;
  readonly label: string;
  readonly iban?: string | undefined;
  readonly isPrimary?: boolean | undefined;
}

export const createBankAccount = (
  ctx: RequestContext,
  input: CreateBankAccountInput,
): Promise<BankAccount> => {
  const created: BankAccount = {
    id: newId(bankAccountIdSchema),
    svjId: input.svjId,
    iban: input.iban ?? null,
    number: input.number,
    bankCode: input.bankCode,
    label: input.label,
    isPrimary: input.isPrimary ?? false,
  };

  return withTenant(ctx, async (tx) => {
    await assertReachable(ctx, input.svjId);
    await tx.insert(bankAccount).values({
      ...created,
      tenantId: ctx.tenantId,
      createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
    });

    await audit.record(ctx, {
      action: 'finance.bank_account.created',
      entity: 'bank_account',
      entityId: created.id,
      reason: 'Založen bankovní účet SVJ',
      after: { number: created.number, bankCode: created.bankCode },
    });

    return created;
  });
};

export const listBankAccounts = (ctx: RequestContext, svjId: SvjId): Promise<readonly BankAccount[]> =>
  withTenant(ctx, async (tx) => {
    await assertReachable(ctx, svjId);
    const rows = await tx
      .select()
      .from(bankAccount)
      .where(eq(bankAccount.svjId, svjId))
      .orderBy(asc(bankAccount.label));

    return rows.map(toBankAccount);
  });

export const getBankAccount = (ctx: RequestContext, bankAccountId: BankAccountId): Promise<BankAccount> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx.select().from(bankAccount).where(eq(bankAccount.id, bankAccountId)).limit(1);

    const row = rows[0];
    if (row === undefined) {
      throw new NotFoundError('Bankovní účet nenalezen', {
        code: 'bank_account_not_found',
        details: { bankAccountId },
      });
    }

    const found = toBankAccount(row);
    await assertReachable(ctx, found.svjId);
    return found;
  });
