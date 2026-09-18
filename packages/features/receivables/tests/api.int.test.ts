import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { bodyOf } from '../../../../apps/api/src/tests/api.fixture';
import { prescriptionSchema, unitBalanceSchema } from '../domain/schemas';
import { PERIOD, PERIOD_QUERY, UNITS_IN_A, startReceivablesApi, type ReceivablesApi } from './api.fixture';

let world: ReceivablesApi;

beforeAll(async () => {
  world = await startReceivablesApi();
}, 300_000);

afterAll(async () => {
  await world.api.stop();
});

const get = (path: string) => world.api.http().get(path);

describe('GET /svj/:svjId/prescriptions', () => {
  it('answers the prescriptions of the month for a committee member of that SVJ', async () => {
    const response = await get(`/svj/${world.houseA.svjId}/prescriptions?${PERIOD_QUERY}`)
      .set('cookie', world.chairOfA)
      .expect(200);

    expect(bodyOf(response, z.array(prescriptionSchema))).toHaveLength(UNITS_IN_A);
  });

  it('hides the prescriptions of an SVJ the committee member is not on', async () => {
    const response = await get(`/svj/${world.svjB}/prescriptions?${PERIOD_QUERY}`).set(
      'cookie',
      world.chairOfA,
    );

    expect(response.status).toBe(404);
  });

  it('hides an SVJ outside the scope of an API token', async () => {
    const token = await world.tokenFor([world.houseA.svjId]);

    const response = await get(`/svj/${world.svjB}/prescriptions?${PERIOD_QUERY}`).set(
      'authorization',
      `Bearer ${token}`,
    );

    expect(response.status).toBe(404);
  });

  it('rejects a month that is not a month', async () => {
    const response = await get(`/svj/${world.houseA.svjId}/prescriptions?year=2026&month=13`).set(
      'cookie',
      world.chairOfA,
    );

    expect(response.status).toBe(400);
  });

  it('answers 401 without a credential', async () => {
    expect((await get(`/svj/${world.houseA.svjId}/prescriptions?${PERIOD_QUERY}`)).status).toBe(401);
  });
});

describe('the balance endpoints', () => {
  it('answers the statement of one unit', async () => {
    const unitId = world.houseA.units[0]?.id ?? '';
    const response = await get(`/svj/${world.houseA.svjId}/units/${unitId}/balance`)
      .set('cookie', world.chairOfA)
      .expect(200);

    expect(bodyOf(response, unitBalanceSchema)).toMatchObject({
      unitId,
      oldestUnpaidPeriod: PERIOD,
    });
  });

  it('answers every unit as a debtor while nothing has been paid', async () => {
    const response = await get(`/svj/${world.houseA.svjId}/debtors?minDebt=1`)
      .set('cookie', world.chairOfA)
      .expect(200);

    expect(bodyOf(response, z.array(z.object({ unitId: z.uuid() })))).toHaveLength(UNITS_IN_A);
  });
});

describe('the published OpenAPI document', () => {
  it('describes all three endpoints of this feature', async () => {
    const document = bodyOf(
      await get('/openapi.json').expect(200),
      z.object({ paths: z.record(z.string(), z.unknown()) }),
    );

    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining([
        '/svj/{svjId}/prescriptions',
        '/svj/{svjId}/units/{unitId}/balance',
        '/svj/{svjId}/debtors',
      ]),
    );
  });
});
