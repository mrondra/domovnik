import type { RequestContext } from '../../../kernel/src/context/index';
import { logger } from '../../../kernel/src/logger/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { listInvoices } from '../../invoices/index';
import { accountingAdapterFor } from '../adapters/index';
import { invoiceDifferences } from '../domain/compare';
import type { SyncConflictId } from '../domain/ids';
import { announceConflicts, openConflict } from './conflicts';
import { linkedSvj, touchSync } from './links';

const MISSING = 'existence';

/**
 * Reads every posted invoice back out of the accounting and writes down where the two copies
 * disagree. It changes neither side: an invoice somebody edited in Pohoda was edited on purpose,
 * and a silent overwrite would lose exactly that (ADR 0005).
 */
export const detectConflicts = async (
  ctx: RequestContext,
  svjId: SvjId,
): Promise<readonly SyncConflictId[]> => {
  const adapter = await accountingAdapterFor(ctx, svjId);
  const posted = await listInvoices(ctx, { svjId, status: 'posted' });
  const found: SyncConflictId[] = [];

  for (const invoice of posted) {
    if (invoice.accountingRef === null) continue;

    const theirs = await adapter.fetchInvoice(ctx, svjId, invoice.accountingRef);
    const differences =
      theirs === null
        ? [{ field: MISSING, ours: invoice.accountingRef, theirs: null }]
        : invoiceDifferences(invoice, theirs);

    for (const difference of differences) {
      const opened = await openConflict(ctx, {
        svjId,
        entityType: 'invoice',
        entityId: invoice.id,
        ...difference,
      });
      if (opened !== null) found.push(opened);
    }
  }

  await touchSync(ctx, svjId);
  await announceConflicts(ctx, svjId, found);
  return found;
};

/** The daily sweep: every house that has an accounting unit, one after another (zadání §5). */
export const detectAcrossTenant = async (ctx: RequestContext): Promise<number> => {
  let opened = 0;

  for (const svjId of await linkedSvj(ctx)) {
    const found = await detectConflicts(ctx, svjId);
    opened += found.length;
    logger().debug({ svjId, conflicts: found.length }, 'Účetní synchronizace zkontrolována');
  }

  return opened;
};
