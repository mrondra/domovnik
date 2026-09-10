import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { composedSchemaFile } from './paths';
import { featureSchemaFiles, renderComposedSchema } from './compose';

describe('renderComposedSchema', () => {
  it('starts from the kernel schema', () => {
    expect(renderComposedSchema([])).toContain("export * from '../../kernel/src/db/schema/index';");
  });

  it('adds one re-export per feature', () => {
    const rendered = renderComposedSchema(['packages/features/svj/schema.ts']);
    expect(rendered).toContain("export * from '../../features/svj/schema';");
  });
});

describe('the committed src/schema.ts', () => {
  // Drizzle Kit diffs against this file, so a feature missing from it silently has no migration.
  it('matches what the generator would write today', async () => {
    const committed = await readFile(composedSchemaFile(), 'utf8');
    expect(committed).toBe(renderComposedSchema(await featureSchemaFiles()));
  });
});
