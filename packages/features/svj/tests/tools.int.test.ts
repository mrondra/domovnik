import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { executeTool, requireTool } from '../../../kernel/src/tools/index';
import { svjGet } from '../tools/get';
import { svjList } from '../tools/list';
import { svjListUnits } from '../tools/list-units';
import { seedHouse, startSvjDb, withTestTenant, type TestDatabase, type TestTenant } from './svj.fixture';

let database: TestDatabase;
let tenant: TestTenant;
let svjA: SvjId;
let svjB: SvjId;

beforeAll(async () => {
  database = await startSvjDb();
  tenant = await withTestTenant();
  svjA = (await seedHouse(tenant.ctx, 'SVJ A')).svj.id;
  svjB = (await seedHouse(tenant.ctx, 'SVJ B')).svj.id;
}, 120_000);

afterAll(async () => {
  await database.stop();
});

const run = (ctx: RequestContext, name: string, input: unknown): Promise<unknown> =>
  executeTool(ctx, name, input).then((execution) =>
    execution.status === 'ok' ? execution.output : execution,
  );

describe('the read tools of this feature', () => {
  it.each([svjGet, svjList, svjListUnits])('registers $name as read-only', (tool) => {
    const registered = requireTool(tool.name);

    expect(registered.readOnly).toBe(true);
    expect(registered.userComposable).toBe(true);
    expect(registered.permission).toBe('svj.read');
  });

  it.each([svjGet, svjList, svjListUnits])('never asks for an approval for $name', async (tool) => {
    expect(await requireTool(tool.name).approval(tenant.ctx, { svjId: svjA })).toMatchObject({
      required: false,
    });
  });
});

describe('svj.list through the runtime', () => {
  it('answers every SVJ a tenant-wide actor may reach', async () => {
    expect(await run(tenant.ctx, svjList.name, {})).toMatchObject([{ name: 'SVJ A' }, { name: 'SVJ B' }]);
  });

  it('answers only the SVJ in the scope of the credential', async () => {
    const scoped = { ...tenant.ctx, svjScope: [svjB] };

    expect(await run(scoped, svjList.name, {})).toMatchObject([{ name: 'SVJ B' }]);
  });
});

describe('svj.get and svj.listUnits through the runtime', () => {
  it('returns the record and its units', async () => {
    expect(await run(tenant.ctx, svjGet.name, { svjId: svjA })).toMatchObject({ name: 'SVJ A' });
    expect(await run(tenant.ctx, svjListUnits.name, { svjId: svjA })).toHaveLength(3);
  });

  it('hides an SVJ outside the scope of the credential', async () => {
    const scoped = { ...tenant.ctx, svjScope: [svjB] };

    await expect(run(scoped, svjGet.name, { svjId: svjA })).rejects.toThrow(/SVJ nenalezeno/);
  });

  it('rejects input that does not match the schema', async () => {
    await expect(run(tenant.ctx, svjGet.name, { svjId: 'nope' })).rejects.toThrow(/Neplatný vstup/);
  });
});
