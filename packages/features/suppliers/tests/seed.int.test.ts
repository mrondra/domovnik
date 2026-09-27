import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as composedSchema from '../../../db/src/schema';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { startTestDb, withTestTenant, type TestDatabase } from '../../../kernel/src/testing/index';
import { readModels, SvjService } from '../../svj/index';
import { listContracts, listSuppliers } from '../service/index';
import { DEMO_CONTRACTS } from '../seed/data/contracts';
import { DEMO_SUPPLIERS } from '../seed/data/suppliers';
import { withChecksum } from '../seed/data/ico';
import { suppliersSeed } from '../seed/suppliers.seed';

let database: TestDatabase;
let ctx: RequestContext;
let tenantId: string;
let houses: readonly SvjId[];

const svj = new SvjService();

const runSeed = (): Promise<void> => suppliersSeed.run({ tenantId: tenantId as never, ctx });

beforeAll(async () => {
  database = await startTestDb({ ...composedSchema });
  const tenant = await withTestTenant();
  ctx = tenant.ctx;
  tenantId = tenant.tenantId;

  for (const [index, name] of ['Kotlářská', 'Brandlova', 'Na Vyhlídce'].entries()) {
    await svj.createSvj(ctx, {
      name: `Společenství vlastníků ${name}`,
      ico: String(26_000_000 + index),
      address: { street: `${name} 1`, city: 'Praha', postalCode: '110 00' },
    });
  }

  const summaries = await readModels.svjSummary(ctx);
  const sequenced = await Promise.all(
    summaries.map(async (one) => ({ id: one.id, at: await readModels.svjSequence(ctx, one.id) })),
  );
  houses = [...sequenced].sort((a, b) => a.at - b.at).map((one) => one.id);

  await runSeed();
}, 300_000);

afterAll(async () => {
  await database.stop();
});

const houseAt = (index: number): SvjId => {
  const found = houses[index];
  if (found === undefined) throw new RangeError(String(index));
  return found;
};

describe('the suppliers seed', () => {
  it('writes the address book with IČO that pass their own check digit', async () => {
    const suppliers = await listSuppliers(ctx);

    expect(suppliers).toHaveLength(DEMO_SUPPLIERS.length);
    for (const supplier of suppliers) {
      expect(withChecksum(supplier.ico.slice(0, 7))).toBe(supplier.ico);
    }
  });

  it('gives each house the contracts its own plan names', async () => {
    for (const [index, expected] of DEMO_CONTRACTS.entries()) {
      await expect(listContracts(ctx, houseAt(index))).resolves.toHaveLength(expected.length);
    }
  });

  it('adds nothing on a second run', async () => {
    await runSeed();

    await expect(listSuppliers(ctx)).resolves.toHaveLength(DEMO_SUPPLIERS.length);
    await expect(listContracts(ctx, houseAt(0))).resolves.toHaveLength(DEMO_CONTRACTS[0]?.length ?? 0);
  });
});
