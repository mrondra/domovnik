import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { composedSource, describeNavigation, renderNavigation } from './compose';
import { navigationFile } from './paths';

describe('describeNavigation', () => {
  it('maps a navigation file to the feature that owns it', () => {
    expect(describeNavigation('packages/features/field-reports/ui/navigation.ts')).toBe('field-reports');
  });
});

describe('renderNavigation', () => {
  it('imports a feature through its ui barrel, never through the navigation file itself', () => {
    const rendered = renderNavigation(['packages/features/field-reports/ui/navigation.ts']);
    expect(rendered).toContain(
      "import { navigation as fieldReportsNavigation } from '../../../../packages/features/field-reports/ui/index';",
    );
    expect(rendered).toContain('[...fieldReportsNavigation]');
  });

  it('renders an empty list while no feature offers navigation', () => {
    expect(renderNavigation([])).toContain('export const featureNavigation: readonly NavigationItem[] = [];');
  });
});

describe('the committed navigation.generated.ts', () => {
  // The shell imports this file; a feature missing from it is a feature nobody can navigate to.
  it('matches what the generator would write today', async () => {
    const committed = await readFile(navigationFile(), 'utf8');
    expect(committed).toBe(await composedSource());
  });
});
