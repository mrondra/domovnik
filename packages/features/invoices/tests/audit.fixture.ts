import { eq } from 'drizzle-orm';
import type { RequestContext } from '../../../kernel/src/context/index';
import { schema, withTenant } from '../../../kernel/src/db/index';

/** What the audit log recorded about one entity, which is the half of a mutation tests forget. */
export const auditActions = (ctx: RequestContext, entityId: string): Promise<readonly string[]> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select({ action: schema.auditLog.action })
      .from(schema.auditLog)
      .where(eq(schema.auditLog.entityId, entityId));
    return rows.map((row) => row.action);
  });
