import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { composedSource, describeModule, renderModules } from './compose';
import { modulesFile } from './paths';

describe('describeModule', () => {
  it('maps a module file to its feature and its exported class', () => {
    expect(describeModule('packages/features/field-reports/api/field-reports.module.ts')).toEqual({
      feature: 'field-reports',
      className: 'FieldReportsModule',
    });
  });
});

describe('renderModules', () => {
  it('imports a feature through its index, never through api/', () => {
    const rendered = renderModules(['packages/features/svj/api/svj.module.ts']);
    expect(rendered).toContain("import { SvjModule } from '../../../../packages/features/svj';");
    expect(rendered).toContain('export const featureModules: readonly Type[] = [SvjModule];');
  });

  it('renders an empty list while no feature exists', () => {
    expect(renderModules([])).toContain('export const featureModules: readonly Type[] = [];');
  });
});

describe('the committed modules.generated.ts', () => {
  // Nest imports this file; a feature missing from it is a feature the API silently does not serve.
  it('matches what the generator would write today', async () => {
    const committed = await readFile(modulesFile(), 'utf8');
    expect(committed).toBe(await composedSource());
  });
});
