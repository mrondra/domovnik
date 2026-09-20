import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { codesOfSeverity } from '../domain/checks';
import { getInvoice, processReceivedInvoice } from '../service/index';
import { auditActions } from './audit.fixture';
import { processScenario, seedCleaningSupplier, seedTidySvj, useRecordedLlm } from './extraction.fixture';
import { someSvj, startInvoicesWorld, withTestTenant, type InvoicesWorld } from './world.fixture';

let world: InvoicesWorld;
let ctx: RequestContext;
let svjId: SvjId;

beforeAll(async () => {
  world = await startInvoicesWorld();
  useRecordedLlm();
  ctx = (await withTestTenant()).ctx;
  svjId = someSvj();
  await seedTidySvj(ctx, svjId, await seedCleaningSupplier(ctx));
}, 300_000);

afterAll(async () => {
  await world.stop();
});

describe('an invoice a person has to look at', () => {
  it('stops an invoice from a supplier nobody has on file', async () => {
    const invoice = await processScenario(ctx, svjId, 'unknown-supplier');

    expect(invoice.status).toBe('needs_review');
    expect(codesOfSeverity(invoice.checks, 'blocking')).toStrictEqual(['supplier_unknown']);
    expect(invoice.supplierId).toBeNull();
  });

  it('stops a number the same supplier has already invoiced, and does not take it over', async () => {
    await processScenario(ctx, svjId, 'as-agreed');
    const repeat = await processScenario(ctx, svjId, 'repeated-number');

    expect(repeat.status).toBe('needs_review');
    expect(codesOfSeverity(repeat.checks, 'blocking')).toContain('duplicate_number');
    expect(repeat.externalNumber).toBeNull();
  });
});

describe('a second delivery of the same event', () => {
  it('reads the file once and leaves the invoice as it was', async () => {
    const first = await processScenario(ctx, svjId, 'delivered-twice');

    await processReceivedInvoice(ctx, first.id);

    expect(await getInvoice(ctx, first.id)).toStrictEqual(first);
    expect(await auditActions(ctx, first.id)).toStrictEqual([
      'finance.invoice.received',
      'finance.invoice.extracted',
    ]);
  });
});
