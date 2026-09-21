import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { accountingStatus } from '../../accounting-sync/index';
import { listDocuments } from '../../documents/index';
import { listInvoices } from '../../invoices/index';
import { listBankAccounts } from '../../payments/index';
import { listDebtors } from '../../receivables/index';
import { readModels } from '../../svj/index';
import { listScenarios, resetDemo, runScenario } from '../service/index';
import { seedDemoTenantWith, startDemoWorld, useRecordedLlm, type DemoWorld } from './demo.fixture';

let world: DemoWorld;
let ctx: RequestContext;
type SvjId = Awaited<ReturnType<typeof readModels.svjSummary>>[number]['id'];

/** The house the statement is about, and the house the invoice arrived at; not the same one. */
let svjId: SvjId;
let invoiceSvjId: SvjId;
let debtorsBefore: number;

const scenarioOfKind = async (kind: string): Promise<string> => {
  const found = (await listScenarios(ctx)).find((one) => one.kind === kind);
  if (found === undefined) throw new RangeError(kind);
  return found.code;
};

beforeAll(async () => {
  world = await startDemoWorld();
  useRecordedLlm();
  ctx = await seedDemoTenantWith();

  // A seeded house, not one of the bare ones the fixture adds: it has units, prescriptions and an
  // account, which is what makes the statement mean anything.
  const houses = await readModels.svjSummary(ctx);
  const candidates = await Promise.all(
    houses.map(async (house) => ({
      house,
      accounts: await listBankAccounts(ctx, house.id),
      debtors: (await listDebtors(ctx, { svjId: house.id, minDebt: 1 })).length,
    })),
  );
  const banked = candidates.find((one) => one.accounts.length > 0 && one.debtors > 0);
  if (banked === undefined) throw new RangeError('bank account');

  svjId = banked.house.id;
  debtorsBefore = banked.debtors;

  await runScenario(ctx, await scenarioOfKind('inbound_invoice'));
  await runScenario(ctx, `bank-sync-${banked.accounts[0]?.id ?? ''}`);

  const arrived = (await listInvoices(ctx))[0];
  if (arrived === undefined) throw new RangeError('invoice');
  invoiceSvjId = arrived.svjId;
}, 600_000);

afterAll(async () => {
  await world.stop();
});

describe('the demonstration, before it is reset', () => {
  it('has produced invoices, documents and paid prescriptions', async () => {
    expect((await listInvoices(ctx)).length).toBeGreaterThan(0);
    expect((await listDocuments(ctx, { svjId: invoiceSvjId, category: 'invoice' })).length).toBeGreaterThan(
      0,
    );
    expect((await listDebtors(ctx, { svjId, minDebt: 1 })).length).toBeLessThan(debtorsBefore);
  });
});

describe('resetting it', () => {
  it('throws away what the demonstration produced', async () => {
    const result = await resetDemo(ctx);

    expect(result.removed).toBeGreaterThan(0);
    await expect(listInvoices(ctx)).resolves.toStrictEqual([]);
    await expect(listDocuments(ctx, { svjId: invoiceSvjId, category: 'invoice' })).resolves.toStrictEqual([]);
    await expect(accountingStatus(ctx, svjId)).resolves.toMatchObject({ jobs: [], conflicts: [] });
  }, 300_000);

  it('puts the money back where it was, so the same story can be told again', async () => {
    await expect(listDebtors(ctx, { svjId, minDebt: 1 })).resolves.toHaveLength(debtorsBefore);
  });

  it('keeps what the seed gave the tenant, because the demonstration did not produce it', async () => {
    expect((await readModels.svjSummary(ctx)).length).toBeGreaterThan(0);
    expect((await listBankAccounts(ctx, svjId)).length).toBeGreaterThan(0);
    expect((await listScenarios(ctx)).length).toBeGreaterThan(0);
  });

  it('leaves the platform able to deliver the same invoice again', async () => {
    const result = await runScenario(ctx, await scenarioOfKind('inbound_invoice'));

    expect(result.outcome).toBe('created');
    expect((await listInvoices(ctx)).length).toBe(1);
  }, 300_000);
});
