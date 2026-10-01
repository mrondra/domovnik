import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createContext, type RequestContext } from '../../../kernel/src/context/index';
import { createUser } from '../../../kernel/src/identity/index';
import { executeTool, requireTool } from '../../../kernel/src/tools/index';
import { suppliersContractFor } from '../tools/contract-for';
import { suppliersGet } from '../tools/get';
import { suppliersSearch } from '../tools/search';
import { updateSupplier } from '../service/index';
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

beforeAll(async () => {
  database = await startSuppliersDb();
  ctx = (await withTestTenant()).ctx;
}, 180_000);

afterAll(async () => {
  await database.stop();
});

describe('the read tools of this feature', () => {
  it.each([suppliersSearch, suppliersGet, suppliersContractFor])(
    'registers $name as read-only and userComposable under suppliers.read',
    (tool) => {
      const registered = requireTool(tool.name);

      expect(registered.readOnly).toBe(true);
      expect(registered.userComposable).toBe(true);
      expect(registered.permission).toBe('suppliers.read');
    },
  );

  it('has no suppliers.write tool', () => {
    expect(() => requireTool('suppliers.write')).toThrow();
  });

  it('suppliers.search finds an active supplier by obor', async () => {
    const supplierId = await seedSupplier(ctx, 'Komíny Morava');
    await updateSupplier(ctx, supplierId, { specializations: ['kominy'] });

    const execution = await executeTool(ctx, suppliersSearch.name, { specialization: 'kominy' });

    expect(execution).toMatchObject({ status: 'ok', output: [{ id: supplierId }] });
  });

  it('suppliers.contractFor answers the contracted firm for an obor', async () => {
    const svjId = someSvj();
    const supplierId = await seedSupplier(ctx, 'Výtahy Ostrava');
    await seedContract(ctx, { svjId, supplierId, validFrom: '2026-01-01', covers: ['vytahy'] });

    const execution = await executeTool(ctx, suppliersContractFor.name, {
      svjId,
      specialization: 'vytahy',
    });

    expect(execution).toMatchObject({ status: 'ok', output: { supplier: { id: supplierId } } });
  });

  describe('suppliers.get', () => {
    it("shows a committee member of SVJ A only that SVJ's contracts with the supplier", async () => {
      const svjA = someSvj();
      const svjB = someSvj();
      const supplierId = await seedSupplier(ctx, 'Hasičárna s.r.o.');
      await seedContract(ctx, {
        svjId: svjA,
        supplierId,
        validFrom: '2026-01-01',
        covers: ['hasici_pristroje'],
      });
      await seedContract(ctx, {
        svjId: svjB,
        supplierId,
        validFrom: '2026-01-01',
        covers: ['hasici_pristroje'],
      });

      const chairOfA = await createUser(ctx, {
        email: `vybor-a-${supplierId}@example.test`,
        displayName: 'Předsedkyně A',
        password: 'test-password',
        roles: ['committee'],
        svjId: svjA,
      });
      const chairContext = createContext({
        tenantId: ctx.tenantId,
        actor: { type: 'user', id: chairOfA, roles: ['committee'] },
      });

      const execution = await executeTool(chairContext, suppliersGet.name, { supplierId });

      expect(execution.status).toBe('ok');
      const output = execution.status === 'ok' ? execution.output : null;
      expect(output).toMatchObject({
        supplier: { id: supplierId },
        contracts: [{ svjId: svjA }],
      });
    });
  });
});
