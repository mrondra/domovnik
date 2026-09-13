import { rm } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateFeature } from '../generate/feature';
import { loadScopes } from '../lib/scopes';
import { readGenerated, scaffoldRepo } from './repo.fixture';

let root: string;

beforeEach(async () => {
  root = await scaffoldRepo();
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const generate = (name: string, addScope = true): Promise<readonly string[]> =>
  generateFeature({ root, name, addScope, install: false });

describe('gen:feature', () => {
  it('writes the whole skeleton', async () => {
    const created = await generate('demo');

    expect(created).toContain('packages/features/demo/schema.ts');
    expect(created).toContain('packages/features/demo/service/demo.service.ts');
    expect(created).toContain('packages/features/demo/tests/demo.int.test.ts');
    expect(await readGenerated(root, 'packages/features/demo/package.json')).toContain(
      '@domovnik/feature-demo',
    );
  });

  it('names the sample table after the feature', async () => {
    await generate('field-reports');

    const schema = await readGenerated(root, 'packages/features/field-reports/schema.ts');
    expect(schema).toContain("svjTable('field_reports_record'");
    expect(schema).toContain('export const fieldReportsRecord');
  });

  it('registers the feature with apps/api, so nothing has to be wired by hand', async () => {
    await generate('demo');

    const barrel = await readGenerated(root, 'apps/api/src/features/modules.generated.ts');
    expect(barrel).toContain("import { DemoModule } from '../../../../packages/features/demo';");
    expect(barrel).toContain('export const featureModules: readonly Type[] = [DemoModule];');
  });

  it('keeps the features it already registered', async () => {
    await generate('demo');
    await generate('invoices', false);

    const barrel = await readGenerated(root, 'apps/api/src/features/modules.generated.ts');
    expect(barrel).toContain('[DemoModule, InvoicesModule]');
  });

  it('refuses to overwrite an existing feature', async () => {
    await generate('demo');

    await expect(generate('demo')).rejects.toThrow(/už existuje/i);
  });

  it('rejects a name outside kebab-case', async () => {
    await expect(generate('Demo Feature')).rejects.toThrow(/kebab-case/);
  });

  it('adds a missing commit scope', async () => {
    expect(await loadScopes(root)).not.toContain('demo');

    await generate('demo');

    expect(await loadScopes(root)).toContain('demo');
  });

  it('keeps an existing commit scope untouched', async () => {
    await generate('invoices', false);

    expect((await loadScopes(root)).filter((scope) => scope === 'invoices')).toHaveLength(1);
  });
});
