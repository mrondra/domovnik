import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  addPerson,
  bodyOf,
  errorOf,
  signIn,
  startApi,
  type ApiHarness,
} from '../../../../apps/api/src/tests/api.fixture';
import { supplierListResponse, supplierResponse } from '../api/suppliers.schema';
import { createSupplier } from '../service/index';
import { featureSchema } from './suppliers.fixture';

let api: ApiHarness;
let manager: string;
let supplierId: string;
let electroSupplierId: string;

beforeAll(async () => {
  api = await startApi(featureSchema);

  const plain = await createSupplier(api.tenant.ctx, {
    name: 'Úklidová firma s.r.o.',
    ico: '20000001',
    bankAccount: '2801234567/2010',
  });
  supplierId = plain.id;

  const electro = await createSupplier(api.tenant.ctx, {
    name: 'Elektro revize s.r.o.',
    ico: '20000002',
    bankAccount: '2801234568/2010',
    specializations: ['revize_elektro'],
  });
  electroSupplierId = electro.id;

  const managerPerson = await addPerson(api.tenant.tenantId, 'manager@example.test', ['manager']);
  manager = await signIn(api, managerPerson);
}, 180_000);

afterAll(async () => {
  await api.stop();
});

const get = (path: string) => api.http().get(path);

describe('GET /suppliers', () => {
  it('answers every active supplier when asked without a filter', async () => {
    const response = await get('/suppliers').set('cookie', manager).expect(200);

    const suppliers = bodyOf(response, supplierListResponse);
    expect(suppliers.map((one) => one.id)).toEqual(expect.arrayContaining([supplierId, electroSupplierId]));
  });

  it('narrows to suppliers that cover the given obor', async () => {
    const response = await get('/suppliers?specialization=revize_elektro').set('cookie', manager).expect(200);

    const suppliers = bodyOf(response, supplierListResponse);
    expect(suppliers.map((one) => one.id)).toStrictEqual([electroSupplierId]);
  });

  it('narrows to suppliers whose name contains the text', async () => {
    const response = await get('/suppliers?q=Elektro').set('cookie', manager).expect(200);

    const suppliers = bodyOf(response, supplierListResponse);
    expect(suppliers.map((one) => one.id)).toStrictEqual([electroSupplierId]);
  });

  it('answers 401 without a credential', async () => {
    expect((await get('/suppliers')).status).toBe(401);
  });
});

describe('GET /suppliers/:id', () => {
  it('answers the supplier', async () => {
    const response = await get(`/suppliers/${supplierId}`).set('cookie', manager).expect(200);

    expect(bodyOf(response, supplierResponse)).toMatchObject({
      id: supplierId,
      name: 'Úklidová firma s.r.o.',
    });
  });

  it('answers 404 for an id that does not exist', async () => {
    const response = await get('/suppliers/00000000-0000-0000-0000-000000000000').set('cookie', manager);

    expect(response.status).toBe(404);
    expect(errorOf(response).code).toBe('supplier_not_found');
  });
});
