import { createApiToken } from '../../../kernel/src/identity/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { addPerson, signIn, startApi, type ApiHarness } from '../../../../apps/api/src/tests/api.fixture';
import type { Period } from '../domain/period';
import { generatePrescriptions } from '../service/index';
import { receivablesListPrescriptions } from '../tools/list-prescriptions';
import { DEMO_PLAN, seedHouse, TEST_SCHEMA, type Seeded } from './receivables.fixture';

export const PERIOD: Period = { year: 2026, month: 9 };
export const PERIOD_QUERY = `year=${String(PERIOD.year)}&month=${String(PERIOD.month)}`;
export const UNITS_IN_A = 3;

export interface ReceivablesApi {
  readonly api: ApiHarness;
  readonly houseA: Seeded;
  readonly svjB: SvjId;
  /** The session of a committee member who sits on SVJ A and on nothing else. */
  readonly chairOfA: string;
  tokenFor(svjScope: readonly SvjId[]): Promise<string>;
}

/** Two SVJ with one month of prescriptions each, which is what a scope test needs to be about. */
export const startReceivablesApi = async (): Promise<ReceivablesApi> => {
  const api = await startApi(TEST_SCHEMA);
  const houseA = await seedHouse(api.tenant.ctx, UNITS_IN_A);
  const svjB = (await seedHouse(api.tenant.ctx, 2)).svjId;

  for (const svjId of [houseA.svjId, svjB]) {
    await generatePrescriptions(api.tenant.ctx, { svjId, period: PERIOD, plan: DEMO_PLAN });
  }

  const chair = await addPerson(api.tenant.tenantId, 'vybor-a@example.test', ['committee'], houseA.svjId);

  return {
    api,
    houseA,
    svjB,
    chairOfA: await signIn(api, chair),
    tokenFor: (svjScope) =>
      createApiToken(api.tenant.ctx, {
        name: 'MCP',
        ownerUserId: api.tenant.adminId,
        allowedTools: [receivablesListPrescriptions.name],
        svjScope,
      }).then((issued) => issued.token),
  };
};
