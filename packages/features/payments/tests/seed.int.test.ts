import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import { listScenarios } from '../../demo/index';
import { SvjService, readModels } from '../../svj/index';
import { bankAccountsSeed } from '../seed/bank-accounts.seed';
import { listBankAccounts } from '../service/index';
import { startPaymentsDb, withTestTenant, type TestDatabase } from './payments.fixture';

let database: TestDatabase;
let ctx: RequestContext;
let tenantId: string;

const svj = new SvjService();

const runSeed = (): Promise<void> => bankAccountsSeed.run({ tenantId: tenantId as never, ctx });

beforeAll(async () => {
  database = await startPaymentsDb();
  const tenant = await withTestTenant();
  ctx = tenant.ctx;
  tenantId = tenant.tenantId;

  await svj.createSvj(ctx, {
    name: 'Společenství vlastníků Kotlářská',
    ico: '26134586',
    address: { street: 'Kotlářská 14', city: 'Praha 8', postalCode: '180 00' },
    bankAccounts: ['2801234567/2010'],
  });
  await svj.createSvj(ctx, {
    name: 'Společenství bez účtu',
    ico: '26134587',
    address: { street: 'Krátká 1', city: 'Praha 1', postalCode: '110 00' },
  });

  await runSeed();
}, 300_000);

afterAll(async () => {
  await database.stop();
});

const houseNamed = async (name: string) => {
  const found = (await readModels.svjSummary(ctx)).find((one) => one.name.includes(name));
  if (found === undefined) throw new RangeError(name);
  return found.id;
};

describe('the payments seed', () => {
  it('opens the account the SVJ already tells everybody to pay into', async () => {
    const accounts = await listBankAccounts(ctx, await houseNamed('Kotlářská'));

    expect(accounts).toMatchObject([{ number: '2801234567', bankCode: '2010', isPrimary: true }]);
  });

  it('leaves a house that has written no account down alone', async () => {
    await expect(listBankAccounts(ctx, await houseNamed('bez účtu'))).resolves.toStrictEqual([]);
  });

  it('offers reading that account as something the demo can do', async () => {
    const scenarios = await listScenarios(ctx);

    expect(scenarios).toHaveLength(1);
    expect(scenarios[0]).toMatchObject({ kind: 'bank_sync' });
    expect(scenarios[0]?.description.length).toBeGreaterThan(40);
  });

  it('adds nothing on a second run', async () => {
    await runSeed();

    await expect(listBankAccounts(ctx, await houseNamed('Kotlářská'))).resolves.toHaveLength(1);
    await expect(listScenarios(ctx)).resolves.toHaveLength(1);
  });
});
