import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  addPerson,
  bodyOf,
  signIn,
  startApi,
  type ApiHarness,
} from '../../../../apps/api/src/tests/api.fixture';
import { startTestStorage, type TestStorage } from '../../../kernel/src/testing/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { invoiceDetailResponse, invoiceListResponse } from '../api/invoices.schema';
import { seedCleaningSupplier, seedTidySvj, useRecordedLlm } from './extraction.fixture';
import { processScenario } from './extraction.fixture';
import { TEST_SCHEMA } from './world.fixture';
import { SvjService } from '../../svj/index';

let api: ApiHarness;
let storage: TestStorage;
let svjA: SvjId;
let svjB: SvjId;
let chairOfA: string;
let accountant: string;
let invoiceInA: string;

const svj = new SvjService();

const house = async (name: string, ico: string): Promise<SvjId> => {
  const created = await svj.createSvj(api.tenant.ctx, {
    name,
    ico,
    address: { street: 'Krátká 1', city: 'Praha 1', postalCode: '110 00' },
  });
  return created.id;
};

beforeAll(async () => {
  api = await startApi(TEST_SCHEMA);
  storage = await startTestStorage();
  useRecordedLlm();

  svjA = await house('SVJ A', '50000001');
  svjB = await house('SVJ B', '50000002');
  const supplierId = await seedCleaningSupplier(api.tenant.ctx);
  await seedTidySvj(api.tenant.ctx, svjA, supplierId);
  await seedTidySvj(api.tenant.ctx, svjB, supplierId);

  invoiceInA = (await processScenario(api.tenant.ctx, svjA, 'as-agreed')).id;
  await processScenario(api.tenant.ctx, svjB, 'bare-svj');

  chairOfA = await signIn(
    api,
    await addPerson(api.tenant.tenantId, 'vybor-a@example.test', ['committee'], svjA),
  );
  accountant = await signIn(api, await addPerson(api.tenant.tenantId, 'ucetni@example.test', ['finance']));
}, 300_000);

afterAll(async () => {
  await storage.stop();
  await api.stop();
});

describe('GET /svj/:svjId/invoices', () => {
  it('answers the invoices of that SVJ to someone on its committee', async () => {
    const response = await api.http().get(`/svj/${svjA}/invoices`).set('cookie', chairOfA).expect(200);

    expect(bodyOf(response, invoiceListResponse)).toHaveLength(1);
  });

  it('hides the invoices of an SVJ the committee member is not on', async () => {
    const response = await api.http().get(`/svj/${svjB}/invoices`).set('cookie', chairOfA);

    expect(response.status).toBe(404);
  });
});

describe('GET /invoices', () => {
  it('answers across SVJ for someone who works with the whole company', async () => {
    const response = await api.http().get('/invoices').set('cookie', accountant).expect(200);

    expect(bodyOf(response, invoiceListResponse)).toHaveLength(2);
  });

  it('answers only the one SVJ to its committee member', async () => {
    const response = await api.http().get('/invoices').set('cookie', chairOfA).expect(200);

    expect(bodyOf(response, invoiceListResponse)).toHaveLength(1);
  });

  it('narrows by status', async () => {
    const response = await api.http().get('/invoices?status=paid').set('cookie', accountant).expect(200);

    expect(bodyOf(response, invoiceListResponse)).toStrictEqual([]);
  });
});

describe('GET /invoices/:id', () => {
  it('answers the whole story of one invoice', async () => {
    const response = await api.http().get(`/invoices/${invoiceInA}`).set('cookie', chairOfA).expect(200);

    expect(bodyOf(response, invoiceDetailResponse)).toMatchObject({
      invoice: { status: 'extracted', externalNumber: '2026-0101' },
      supplier: { ico: '27000111' },
      contract: { budgetCategory: 'uklid' },
      budget: { category: 'uklid' },
    });
  });

  it('answers 401 without a credential', async () => {
    expect((await api.http().get(`/invoices/${invoiceInA}`)).status).toBe(401);
  });
});

describe('the address book endpoints', () => {
  it('answers the suppliers and the contracts in force', async () => {
    const suppliers = await api.http().get('/suppliers').set('cookie', accountant).expect(200);
    const contracts = await api.http().get(`/svj/${svjA}/contracts`).set('cookie', chairOfA).expect(200);

    expect(bodyOf(suppliers, z.array(z.object({ ico: z.string() })))).toMatchObject([{ ico: '27000111' }]);
    expect(bodyOf(contracts, z.array(z.object({ subject: z.string() })))).toHaveLength(1);
  });
});
