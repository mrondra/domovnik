import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { executeTool, requireTool } from '../../../kernel/src/tools/index';
import { invoiceProcessor } from '../agents/invoice-processor/agent';
import { getInvoice } from '../service/index';
import { invoiceApprove } from '../tools/approve';
import { invoiceFlagReview } from '../tools/flag-review';
import { invoiceGet } from '../tools/get';
import { invoiceSupplierHistory } from '../tools/supplier-history';
import { readyForApproval, type ReadyForApproval } from './approval.fixture';
import { useRecordedLlm } from './extraction.fixture';
import { startInvoicesWorld, withTestTenant, type InvoicesWorld } from './world.fixture';

let world: InvoicesWorld;
let ctx: RequestContext;
let ready: ReadyForApproval;

beforeAll(async () => {
  world = await startInvoicesWorld();
  useRecordedLlm();
  ctx = (await withTestTenant()).ctx;
  ready = await readyForApproval(ctx, 'as-agreed');
}, 300_000);

afterAll(async () => {
  await world.stop();
});

describe('the read tools of this feature', () => {
  it.each([invoiceGet, invoiceSupplierHistory])('registers $name as read-only', (tool) => {
    const registered = requireTool(tool.name);

    expect(registered.readOnly).toBe(true);
    expect(registered.userComposable).toBe(true);
    expect(registered.permission).toBe('finance.read');
  });

  it('answers everything known about one invoice in a single call', async () => {
    const execution = await executeTool(ctx, invoiceGet.name, { invoiceId: ready.invoiceId });

    expect(execution).toMatchObject({
      status: 'ok',
      output: {
        invoice: { status: 'extracted' },
        contract: { budgetCategory: 'uklid' },
        budget: { category: 'uklid' },
      },
    });
  });

  it('answers the invoices this supplier has sent this SVJ before', async () => {
    const invoice = await getInvoice(ctx, ready.invoiceId);
    const execution = await executeTool(ctx, invoiceSupplierHistory.name, {
      svjId: ready.svjId,
      supplierId: invoice.supplierId,
    });

    expect(execution).toMatchObject({ status: 'ok', output: [{ externalNumber: '2026-0101' }] });
  });
});

describe('the writing tools of this feature', () => {
  it('offers both as proposals a person decides about, not as acts', () => {
    for (const tool of [invoiceApprove, invoiceFlagReview]) {
      const registered = requireTool(tool.name);

      expect(registered.proposal).toBe(true);
      expect(registered.readOnly).toBe(false);
      expect(registered.userComposable).toBe(false);
    }
  });

  it('always asks the committee before an invoice is approved', async () => {
    const policy = await requireTool(invoiceApprove.name).approval(ctx, {
      invoiceId: ready.invoiceId,
      summary: 'Úklid za září.',
      recommendation: 'approve',
      risks: [],
    });

    expect(policy).toMatchObject({ required: true, approvers: [ready.chairId] });
  });

  it('writes a note without moving the invoice', async () => {
    const blocked = await readyForApproval(ctx, 'bare-svj');
    const execution = await executeTool(ctx, invoiceFlagReview.name, {
      invoiceId: blocked.invoiceId,
      note: 'Chybí smlouva.',
      missing: ['smlouva'],
    });

    expect(execution).toMatchObject({ status: 'ok' });
    await expect(getInvoice(ctx, blocked.invoiceId)).resolves.toMatchObject({
      checks: { reviewNote: { note: 'Chybí smlouva.' } },
    });
  });
});

describe('the invoice-processor agent', () => {
  it('is composed only of tools about invoices, documents and the SVJ itself', () => {
    expect(invoiceProcessor.tools.some((name) => name.startsWith('payment.'))).toBe(false);
    expect(invoiceProcessor.autonomy).toBe('propose');
  });
});
