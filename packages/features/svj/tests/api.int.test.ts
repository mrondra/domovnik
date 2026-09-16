import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApiToken } from '../../../kernel/src/identity/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import {
  addPerson,
  bodyOf,
  signIn,
  startApi,
  type ApiHarness,
} from '../../../../apps/api/src/tests/api.fixture';
import { svjSchema, svjSummarySchema, unitSchema } from '../domain/schemas';
import { createDepartment } from '../service/index';
import { svjList } from '../tools/list';
import { featureSchema, seedHouse } from './svj.fixture';

const summaryList = z.array(svjSummarySchema);

let api: ApiHarness;
let svjA: SvjId;
let svjB: SvjId;
let admin: string;

beforeAll(async () => {
  api = await startApi(featureSchema);
  svjA = (await seedHouse(api.tenant.ctx, 'SVJ A')).svj.id;
  svjB = (await seedHouse(api.tenant.ctx, 'SVJ B')).svj.id;
  await createDepartment(api.tenant.ctx, { code: 'maintenance', name: 'Údržba' });
  const person = await addPerson(api.tenant.tenantId, 'spravce@example.test', ['manager']);
  admin = await signIn(api, person);
}, 180_000);

afterAll(async () => {
  await api.stop();
});

const tokenFor = (svjScope: readonly SvjId[]): Promise<string> =>
  createApiToken(api.tenant.ctx, {
    name: 'MCP',
    ownerUserId: api.tenant.adminId,
    allowedTools: [svjList.name],
    svjScope,
  }).then((issued) => issued.token);

describe('GET /svj', () => {
  it('answers the SVJ of the tenant with their unit counts', async () => {
    const response = await api.http().get('/svj').set('cookie', admin).expect(200);

    expect(bodyOf(response, summaryList)).toMatchObject([
      { id: svjA, name: 'SVJ A', unitCount: 3 },
      { id: svjB, name: 'SVJ B', unitCount: 3 },
    ]);
  });

  it('answers only what the SVJ scope of an API token covers', async () => {
    const token = await tokenFor([svjB]);

    const response = await api.http().get('/svj').set('authorization', `Bearer ${token}`).expect(200);

    expect(bodyOf(response, summaryList).map((one) => one.name)).toEqual(['SVJ B']);
  });
});

describe('GET /svj/:id and /svj/:id/units', () => {
  it('answers the record and the units', async () => {
    const detail = await api.http().get(`/svj/${svjA}`).set('cookie', admin).expect(200);
    const units = await api.http().get(`/svj/${svjA}/units`).set('cookie', admin).expect(200);

    expect(bodyOf(detail, svjSchema).name).toBe('SVJ A');
    expect(bodyOf(units, z.array(unitSchema)).map((one) => one.number)).toEqual(['1', '2', '3']);
  });

  it('answers 404 for an SVJ outside the scope of the token', async () => {
    const token = await tokenFor([svjB]);

    const response = await api.http().get(`/svj/${svjA}`).set('authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('answers 401 without a credential', async () => {
    expect((await api.http().get('/svj')).status).toBe(401);
  });
});

describe('GET /departments', () => {
  it('answers the departments of the management company', async () => {
    const response = await api.http().get('/departments').set('cookie', admin).expect(200);

    expect(bodyOf(response, z.array(z.object({ code: z.string(), name: z.string() })))).toMatchObject([
      { code: 'maintenance', name: 'Údržba' },
    ]);
  });
});
