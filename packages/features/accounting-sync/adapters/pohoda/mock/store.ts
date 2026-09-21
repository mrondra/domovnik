import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { RequestContext } from '../../../../../kernel/src/context/index';
import { withTenant } from '../../../../../kernel/src/db/index';
import { newRowId, type SvjId } from '../../../../../kernel/src/ids/index';
import { pohodaMockStore } from '../../../schema/index';

const jsonObject = z.record(z.string(), z.unknown());

export interface StoredDocument {
  readonly ref: string;
  readonly kind: string;
  readonly xml: string;
  readonly state: Readonly<Record<string, unknown>>;
}

/**
 * What the demo's Pohoda has been told, kept in a table rather than in memory so a demonstration
 * survives a restart. Reading it back is how `fetchInvoice` answers, which is what makes a
 * disagreement between the two sides detectable at all (task 024).
 */
export const remember = (ctx: RequestContext, svjId: SvjId, document: StoredDocument): Promise<void> =>
  withTenant(ctx, async (tx) => {
    await tx
      .insert(pohodaMockStore)
      .values({
        id: newRowId(),
        tenantId: ctx.tenantId,
        svjId,
        createdBy: ctx.actor.type === 'user' ? ctx.actor.id : null,
        ref: document.ref,
        kind: document.kind,
        xml: document.xml,
        state: document.state,
      })
      .onConflictDoNothing({
        target: [pohodaMockStore.tenantId, pohodaMockStore.svjId, pohodaMockStore.ref],
      });
  });

export const recall = (ctx: RequestContext, svjId: SvjId, ref: string): Promise<StoredDocument | null> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(pohodaMockStore)
      .where(and(eq(pohodaMockStore.svjId, svjId), eq(pohodaMockStore.ref, ref)))
      .limit(1);

    const row = rows[0];
    return row === undefined
      ? null
      : {
          ref: row.ref,
          kind: row.kind,
          xml: row.xml,
          state: jsonObject.parse(row.state),
        };
  });

/** Everything of one kind this house was told, newest first; the reading side filters it. */
export const recallKind = (
  ctx: RequestContext,
  svjId: SvjId,
  kind: string,
): Promise<readonly StoredDocument[]> =>
  withTenant(ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(pohodaMockStore)
      .where(and(eq(pohodaMockStore.svjId, svjId), eq(pohodaMockStore.kind, kind)));

    return rows.map((row) => ({
      ref: row.ref,
      kind: row.kind,
      xml: row.xml,
      state: jsonObject.parse(row.state),
    }));
  });

export const amend = (
  ctx: RequestContext,
  svjId: SvjId,
  ref: string,
  patch: Readonly<Record<string, unknown>>,
): Promise<void> =>
  withTenant(ctx, async (tx) => {
    const current = await recall(ctx, svjId, ref);
    if (current === null) return;

    await tx
      .update(pohodaMockStore)
      .set({ state: { ...current.state, ...patch }, updatedAt: new Date() })
      .where(and(eq(pohodaMockStore.svjId, svjId), eq(pohodaMockStore.ref, ref)));
  });
