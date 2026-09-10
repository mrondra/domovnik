import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { GeneratorError } from '../lib/cli';
import { writeAll } from '../lib/files';
import { isKebabCase, namesOf } from '../lib/names';
import { featurePath } from '../lib/repo';
import { toolFiles } from '../templates/tool';

export interface ToolOptions {
  readonly root: string;
  readonly feature: string;
  readonly name: string;
  readonly requiresApproval: boolean;
}

export const requireFeature = (root: string, feature: string): void => {
  if (!existsSync(join(root, featurePath(feature)))) {
    throw new GeneratorError(
      `Feature ${feature} neexistuje \u2013 nejd\u0159\u00edv pnpm gen:feature ${feature}.`,
    );
  }
};

export const generateTool = async (options: ToolOptions): Promise<readonly string[]> => {
  if (!isKebabCase(options.feature) || !isKebabCase(options.name)) {
    throw new GeneratorError('Feature i tool mus\u00ed b\u00fdt kebab-case.');
  }
  requireFeature(options.root, options.feature);

  const files = toolFiles({
    feature: namesOf(options.feature),
    tool: namesOf(options.name),
    requiresApproval: options.requiresApproval,
  });
  await writeAll(options.root, files);

  return files.map((file) => file.path);
};
