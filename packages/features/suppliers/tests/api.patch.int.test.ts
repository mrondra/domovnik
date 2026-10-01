import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  addPerson,
  bodyOf,
  signIn,
  startApi,
  type ApiHarness,
} from '../../../../apps/api/src/tests/api.fixture';
import { supplierResponse } from '../api/suppliers.schema';
import { createSupplier } from '../service/index';
import { featureSchema, someSvj } from './suppliers.fixture';

let api: ApiHarness;
let manager: string;
let committee: string;
let supplierId: string;

beforeAll(async () => {
  api = await startApi(featureSchema);
  const svjId = someSvj();

  const plain = await createSupplier(api.tenant.ctx, {
    name: 'Úklidová firma s.r.o.',
    ico: '20000001',
    bankAccount: '2801234567/2010',
  });
  supplierId = plain.id;

  const managerPerson = await addPerson(api.tenant.tenantId, 'manager@example.test', ['manager']);
  const committeePerson = await addPerson(api.tenant.tenantId, 'vybor@example.test', ['committee'], svjId);
  manager = await signIn(api, managerPerson);
  committee = await signIn(api, committeePerson);
}, 180_000);

afterAll(async () => {
  await api.stop();
});

describe('PATCH /suppliers/:id', () => {
  it('is refused to a committee member, who may only read', async () => {
    const response = await api
      .http()
      .patch(`/suppliers/${supplierId}`)
      .set('cookie', committee)
      .send({ phone: '+420123456789' });

    expect(response.status).toBe(403);
  });

  it('changes the supplier for a manager', async () => {
    const response = await api
      .http()
      .patch(`/suppliers/${supplierId}`)
      .set('cookie', manager)
      .send({ phone: '+420123456789', contactPerson: 'Jana Nováková' })
      .expect(200);

    expect(bodyOf(response, supplierResponse)).toMatchObject({
      id: supplierId,
      phone: '+420123456789',
      contactPerson: 'Jana Nováková',
    });
  });
});
