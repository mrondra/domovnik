import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { schema, withTenant } from '../../../kernel/src/db/index';
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

// The recorded extraction answers are keyed by a hash of the PDF text, which carries the date the
// seed issued the invoices on. Frozen to the day they were recorded against.
vi.mock('../domain/today', () => ({ demoToday: (): Date => new Date('2026-09-01T08:00:00.000Z') }));

let world: DemoWorld;
let ctx: RequestContext;

/** Runs a scenario and lets the deterministic half of the platform do what it would do. */
const deliver = async (code: string): Promise<Invoice> => {
  const result = await runScenario(ctx, code);
  const invoiceId = invoiceIdSchema.parse(result.link?.path.split('/').at(-1));
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

  it('offers showing a change somebody made in the accounting itself', async () => {
    const scenarios = await listScenarios(ctx);

    expect(scenarios.some((one) => one.kind === 'pohoda_mutation')).toBe(true);
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

  it('says plainly that there is nothing in the accounting to change yet', async () => {
    const mutation = (await listScenarios(ctx)).find((one) => one.kind === 'pohoda_mutation');
    if (mutation === undefined) throw new RangeError('pohoda_mutation');

    const result = await runScenario(ctx, mutation.code);

    expect(result.outcome).toBe('conflict');
    expect(result.message).toContain('není žádná faktura');
  });

  it('recognises the file it has already delivered', async () => {
    const again = await runScenario(ctx, 'invoice-duplicate');

    expect(again.outcome).toBe('duplicate');
  });
});

describe('the daily-tick scenario the demo feature offers about itself', () => {
  /** How many `tick.daily` events the outbox holds for this tenant. */
  const dailyTickCount = (): Promise<number> =>
    withTenant(ctx, async (tx) => {
      const rows = await tx.select().from(schema.event).where(eq(schema.event.name, 'tick.daily'));
      return rows.length;
    });

  it('puts tick.daily in the outbox for this tenant', async () => {
    const before = await dailyTickCount();

    const result = await runScenario(ctx, 'daily-tick');

    expect(result.outcome).toBe('started');
    await expect(dailyTickCount()).resolves.toBe(before + 1);
  });
});
