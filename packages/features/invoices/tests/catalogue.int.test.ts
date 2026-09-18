import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import type { SupplierId } from '../domain/ids';
import { createContract, findContractsForSupplier, findSupplierByIco, listSuppliers } from '../service/index';
import { auditActions } from './audit.fixture';
import {
  seedSupplier,
  someSvj,
  startInvoicesDb,
  withTestTenant,
  type TestDatabase,
} from './invoices.fixture';

let database: TestDatabase;
let ctx: RequestContext;
let svjId: SvjId;
let supplierId: SupplierId;

beforeAll(async () => {
  database = await startInvoicesDb();
  ctx = (await withTestTenant()).ctx;
  svjId = someSvj();
  supplierId = await seedSupplier(ctx, 'Úklid s.r.o.');
}, 180_000);

afterAll(async () => {
  await database.stop();
});

describe('suppliers', () => {
  it('finds a supplier by the IČO an invoice carries', async () => {
    const listed = await listSuppliers(ctx);
    const ico = listed.find((one) => one.id === supplierId)?.ico ?? '';

    await expect(findSupplierByIco(ctx, ico)).resolves.toMatchObject({ id: supplierId });
    await expect(findSupplierByIco(ctx, 'nikdo')).resolves.toBeNull();
  });

  it('records the founding of a supplier in the audit log', async () => {
    await expect(auditActions(ctx, supplierId)).resolves.toStrictEqual(['finance.supplier.created']);
  });
});

describe('findContractsForSupplier', () => {
  it('answers the contract that was in force on the day, and no other', async () => {
    const ended = await createContract(ctx, {
      svjId,
      supplierId,
      subject: 'Úklid 2025',
      budgetCategory: 'uklid',
      validFrom: '2025-01-01',
      validTo: '2025-12-31',
    });
    const running = await createContract(ctx, {
      svjId,
      supplierId,
      subject: 'Úklid od 2026',
      budgetCategory: 'uklid',
      validFrom: '2026-01-01',
    });

    const inSeptember = await findContractsForSupplier(ctx, {
      svjId,
      supplierId,
      on: new Date('2026-09-15T00:00:00.000Z'),
    });
    const inMay2025 = await findContractsForSupplier(ctx, {
      svjId,
      supplierId,
      on: new Date('2025-05-15T00:00:00.000Z'),
    });

    expect(inSeptember.map((one) => one.id)).toStrictEqual([running.id]);
    expect(inMay2025.map((one) => one.id)).toStrictEqual([ended.id]);
  });
});
