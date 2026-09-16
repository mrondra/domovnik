import { eq } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { withTenant } from '../../../kernel/src/db/index';
import { schema } from '../../../kernel/src/db/index';
import { createUser } from '../../../kernel/src/identity/index';
import { userIdSchema, type SvjId, type UserId } from '../../../kernel/src/ids/index';

const DEMO_PASSWORD = 'domovnik-demo';

export interface ChairInput {
  readonly email: string;
  readonly displayName: string;
  readonly svjId: SvjId;
}

const findByEmail = (ctx: RequestContext, email: string): Promise<UserId | undefined> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.email, email))
      .limit(1);
    const found = rows[0];
    return found === undefined ? undefined : userIdSchema.parse(found.id);
  });

/**
 * A committee member scoped to one SVJ — the role row carries `svj_id`, which is what makes the
 * demo show that the chair of one SVJ does not see the others (task 007, acceptance criteria).
 */
export const ensureChair = async (ctx: RequestContext, input: ChairInput): Promise<UserId> =>
  (await findByEmail(ctx, input.email)) ??
  (await createUser(ctx, {
    email: input.email,
    displayName: input.displayName,
    password: DEMO_PASSWORD,
    roles: ['committee'],
    svjId: input.svjId,
  }));
