import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { SupplierId } from '../domain/ids';
import { contractedSupplierFor } from '../service/index';
import {
  seedContract,
  seedSupplier,
  someSvj,
  startSuppliersDb,
  withTestTenant,
  type TestDatabase,
} from './suppliers.fixture';

let database: TestDatabase;
let ctx: RequestContext;
let svjId: SvjId;
let supplierId: SupplierId;

const on = new Date('2026-09-30T00:00:00.000Z');

beforeAll(async () => {
  database = await startSuppliersDb();
  ctx = (await withTestTenant()).ctx;
  svjId = someSvj();
  supplierId = await seedSupplier(ctx, 'Revize Elektro s.r.o.');
}, 180_000);

afterAll(async () => {
  await database.stop();
});

describe('contractedSupplierFor', () => {
  it('finds the supplier of a contract that covers the obor and is currently valid', async () => {
    await seedContract(ctx, {
      svjId,
      supplierId,
      validFrom: '2026-01-01',
      covers: ['revize_elektro'],
    });

    const found = await contractedSupplierFor(ctx, { svjId, specialization: 'revize_elektro', on });

    expect(found?.supplier.id).toBe(supplierId);
  });

  it('answers null when no contract in force covers the obor', async () => {
    const otherSvj = someSvj();
    await seedContract(ctx, {
      svjId: otherSvj,
      supplierId,
      validFrom: '2026-01-01',
      covers: ['revize_elektro'],
    });

    await expect(
      contractedSupplierFor(ctx, { svjId: otherSvj, specialization: 'hasici_pristroje', on }),
    ).resolves.toBeNull();
  });

  it('answers null when the only matching contract has already ended', async () => {
    const endedSvj = someSvj();
    await seedContract(ctx, {
      svjId: endedSvj,
      supplierId,
      validFrom: '2024-01-01',
      validTo: '2025-12-31',
      covers: ['kominy'],
    });

    await expect(
      contractedSupplierFor(ctx, { svjId: endedSvj, specialization: 'kominy', on }),
    ).resolves.toBeNull();
  });

  it('picks the contract with the newest validFrom when two both cover the obor', async () => {
    const twoContracts = someSvj();
    const olderSupplier = await seedSupplier(ctx, 'Starší firma');
    const newerSupplier = await seedSupplier(ctx, 'Novější firma');

    await seedContract(ctx, {
      svjId: twoContracts,
      supplierId: olderSupplier,
      validFrom: '2025-01-01',
      covers: ['uklid'],
    });
    await seedContract(ctx, {
      svjId: twoContracts,
      supplierId: newerSupplier,
      validFrom: '2026-01-01',
      covers: ['uklid'],
    });

    const found = await contractedSupplierFor(ctx, { svjId: twoContracts, specialization: 'uklid', on });

    expect(found?.supplier.id).toBe(newerSupplier);
  });
});
