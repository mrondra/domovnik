import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  addPerson,
  bodyOf,
  signIn,
  startApi,
  type ApiHarness,
} from '../../../../apps/api/src/tests/api.fixture';
import { supplierListResponse } from '../api/suppliers.schema';
import { createSupplier } from '../service/index';
import { featureSchema } from './suppliers.fixture';

let api: ApiHarness;
let manager: string;
let inactiveSupplierId: string;
let extraSupplierIds: string[];

beforeAll(async () => {
  api = await startApi(featureSchema);

  const inactive = await createSupplier(api.tenant.ctx, {
    name: 'Zaniklá úklidová s.r.o.',
    ico: '20000003',
    isActive: false,
  });
  inactiveSupplierId = inactive.id;

  extraSupplierIds = [];
  for (let i = 0; i < 10; i += 1) {
    const extra = await createSupplier(api.tenant.ctx, {
      name: `Dodavatel navíc ${String(i).padStart(2, '0')} s.r.o.`,
      ico: `2000010${String(i)}`,
    });
    extraSupplierIds.push(extra.id);
  }

  const managerPerson = await addPerson(api.tenant.tenantId, 'manager@example.test', ['manager']);
  manager = await signIn(api, managerPerson);
}, 180_000);

afterAll(async () => {
  await api.stop();
});

const get = (path: string) => api.http().get(path);

describe('GET /suppliers', () => {
  it('answers all matches, not truncated to the tool default of 10', async () => {
    const response = await get('/suppliers').set('cookie', manager).expect(200);

    const suppliers = bodyOf(response, supplierListResponse);
    const ids = suppliers.map((one) => one.id);
    expect(ids.length).toBeGreaterThan(10);
    expect(ids).toEqual(expect.arrayContaining(extraSupplierIds));
  });

  it('includes inactive suppliers, since the HTTP listing has no activeOnly filter', async () => {
    const response = await get('/suppliers').set('cookie', manager).expect(200);

    const suppliers = bodyOf(response, supplierListResponse);
    expect(suppliers.map((one) => one.id)).toContain(inactiveSupplierId);
  });
});
