import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { NotFoundError } from '../../../kernel/src/errors/index';
import {
  codesOfSeverity,
  getInvoice,
  invoiceIdSchema,
  processReceivedInvoice,
  type Invoice,
} from '../../invoices/index';
import { listScenarios, runScenario } from '../service/index';
import { seedDemoTenantWith, startDemoWorld, useRecordedLlm, type DemoWorld } from './demo.fixture';

let world: DemoWorld;
let ctx: RequestContext;

/** Runs a scenario and lets the deterministic half of the platform do what it would do. */
const deliver = async (code: string): Promise<Invoice> => {
  const result = await runScenario(ctx, code);
  const invoiceId = invoiceIdSchema.parse(result.invoiceId);
  await processReceivedInvoice(ctx, invoiceId);
  return getInvoice(ctx, invoiceId);
};

beforeAll(async () => {
  world = await startDemoWorld();
  useRecordedLlm();
  ctx = await seedDemoTenantWith();
}, 300_000);

afterAll(async () => {
  await world.stop();
});

describe('the scenarios the seed prepared', () => {
  it('each says what it is meant to show', async () => {
    const scenarios = await listScenarios(ctx);

    const invoices = scenarios.filter((one) => one.kind === 'inbound_invoice');

    expect(invoices).toHaveLength(5);
    expect(scenarios.every((one) => one.description.length > 40)).toBe(true);
    expect(scenarios.map((one) => one.code)).toContain('invoice-duplicate');
    // `payments` registers one of its own per bank account (task 021).
    expect(scenarios.some((one) => one.kind === 'bank_sync')).toBe(true);
  });

  it('refuses a scenario nobody prepared', async () => {
    await expect(runScenario(ctx, 'neexistuje')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('running a scenario', () => {
  it('lets an ordinary invoice through with nothing to say about it', async () => {
    const invoice = await deliver('invoice-routine');

    expect(invoice.status).toBe('extracted');
    expect(codesOfSeverity(invoice.checks, 'warning')).toStrictEqual([]);
  });

  it('warns that the roofing job does not fit in what is left of the budget', async () => {
    const invoice = await deliver('invoice-over-budget');

    expect(invoice.status).toBe('extracted');
    expect(codesOfSeverity(invoice.checks, 'warning')).toContain('budget_exceeded');
  });

  it('warns that the lift invoice is above the contract', async () => {
    const invoice = await deliver('invoice-above-contract');

    expect(invoice.status).toBe('extracted');
    expect(codesOfSeverity(invoice.checks, 'warning')).toContain('amount_deviates');
  });

  it('stops the invoice from a company nobody has on file', async () => {
    const invoice = await deliver('invoice-unknown-supplier');

    expect(invoice.status).toBe('needs_review');
    expect(codesOfSeverity(invoice.checks, 'blocking')).toContain('supplier_unknown');
  });

  it('recognises the file it has already delivered', async () => {
    const again = await runScenario(ctx, 'invoice-duplicate');

    expect(again.outcome).toBe('duplicate');
  });
});
