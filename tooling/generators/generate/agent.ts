import { GeneratorError } from '../lib/cli';
import { writeAll } from '../lib/files';
import { isKebabCase, namesOf } from '../lib/names';
import { agentFiles } from '../templates/agent';
import { requireFeature } from './tool';

export interface AgentOptions {
  readonly root: string;
  readonly feature: string;
  readonly name: string;
}

export const generateAgent = async (options: AgentOptions): Promise<readonly string[]> => {
  if (!isKebabCase(options.feature) || !isKebabCase(options.name)) {
    throw new GeneratorError('Feature i agent mus\u00ed b\u00fdt kebab-case.');
  }
  requireFeature(options.root, options.feature);

  const files = agentFiles({ feature: namesOf(options.feature), agent: namesOf(options.name) });
  await writeAll(options.root, files);

  return files.map((file) => file.path);
};
