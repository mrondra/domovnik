import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { TenantId } from '../../../kernel/src/ids/index';
import { SvjService, readModels } from '../../svj/index';
import { accountingLinksSeed } from '../seed/accounting-links.seed';
import { linkOf, linkSvj } from '../service/index';
import { startComposedDb, withTestTenant, type TestDatabase } from './accounting.fixture';

let database: TestDatabase;
let ctx: RequestContext;
let tenantId: TenantId;

const svj = new SvjService();

const runSeed = (): Promise<void> => accountingLinksSeed.run({ tenantId, ctx });

beforeAll(async () => {
  database = await startComposedDb();
  const tenant = await withTestTenant();
  ctx = tenant.ctx;
  tenantId = tenant.tenantId;

  await svj.createSvj(ctx, {
    name: 'Společenství vlastníků Kotlářská',
    ico: '26134586',
    address: { street: 'Kotlářská 14', city: 'Praha 8', postalCode: '180 00' },
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

describe('the accounting-sync seed', () => {
  it('makes every demo house its own accounting unit, served by the demo Pohoda', async () => {
    await expect(linkOf(ctx, await houseNamed('Kotlářská'))).resolves.toMatchObject({
      companyIco: '26134586',
      accountingAdapter: 'mock',
      receivablesAdapter: 'internal',
    });
  });

  it('leaves a house somebody repointed as they left it', async () => {
    const svjId = await houseNamed('Kotlářská');
    await linkSvj(ctx, { svjId, companyIco: '26134586', accountingAdapter: 'mserver' });

    await runSeed();

    await expect(linkOf(ctx, svjId)).resolves.toMatchObject({ accountingAdapter: 'mserver' });
  });
});
