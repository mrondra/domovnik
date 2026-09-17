import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RequestContext } from '../../../kernel/src/context/index';
import type { SvjId } from '../../../kernel/src/ids/index';
import { executeTool, requireTool } from '../../../kernel/src/tools/index';
import type { DocumentId } from '../domain/ids';
import { documentGet } from '../tools/get';
import { documentList } from '../tools/list';
import {
  scopedTo,
  someSvj,
  startDocumentsWorld,
  storeSample,
  withTestTenant,
  type TestTenant,
  type TestWorld,
} from './documents.fixture';

let world: TestWorld;
let tenant: TestTenant;
let svjA: SvjId;
let svjB: SvjId;
let inA: DocumentId;

beforeAll(async () => {
  world = await startDocumentsWorld();
  tenant = await withTestTenant();
  svjA = someSvj();
  svjB = someSvj();
  inA = (await storeSample(tenant.ctx, svjA, { title: 'Faktura SVJ A' })).id;
  await storeSample(tenant.ctx, svjB, { title: 'Faktura SVJ B' });
}, 300_000);

afterAll(async () => {
  await world.stop();
});

const run = (ctx: RequestContext, name: string, input: unknown): Promise<unknown> =>
  executeTool(ctx, name, input).then((execution) =>
    execution.status === 'ok' ? execution.output : execution,
  );

describe('the read tools of this feature', () => {
  it.each([documentGet, documentList])('registers $name as read-only', (tool) => {
    const registered = requireTool(tool.name);

    expect(registered.readOnly).toBe(true);
    expect(registered.userComposable).toBe(true);
    expect(registered.permission).toBe('documents.read');
  });

  it('never asks for an approval, whichever of the two is called', async () => {
    const asked = [
      await requireTool(documentGet.name).approval(tenant.ctx, { documentId: inA }),
      await requireTool(documentList.name).approval(tenant.ctx, { svjId: svjA }),
    ];

    expect(asked).toMatchObject([{ required: false }, { required: false }]);
  });
});

describe('document.get through the runtime', () => {
  it('answers the metadata together with a working link', async () => {
    const output = await run(tenant.ctx, documentGet.name, { documentId: inA });

    expect(output).toMatchObject({ title: 'Faktura SVJ A', category: 'invoice' });
    expect(await fetch((output as { downloadUrl: string }).downloadUrl)).toMatchObject({
      status: 200,
    });
  });

  it('hides a document of an SVJ outside the scope of the credential', async () => {
    const scoped = scopedTo(tenant.ctx, [svjB]);

    await expect(run(scoped, documentGet.name, { documentId: inA })).rejects.toThrow(/Dokument nenalezen/);
  });

  it('rejects input that does not match the schema', async () => {
    await expect(run(tenant.ctx, documentGet.name, { documentId: 'nope' })).rejects.toThrow(/Neplatný vstup/);
  });
});

describe('document.list through the runtime', () => {
  it('answers only the documents of the SVJ it was asked about', async () => {
    expect(await run(tenant.ctx, documentList.name, { svjId: svjA })).toMatchObject([
      { title: 'Faktura SVJ A' },
    ]);
  });

  it('narrows by category', async () => {
    expect(await run(tenant.ctx, documentList.name, { svjId: svjA, category: 'contract' })).toStrictEqual([]);
  });
});
