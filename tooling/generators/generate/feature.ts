import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { GeneratorError, report } from '../lib/cli';
import { writeAll } from '../lib/files';
import { isKebabCase, namesOf } from '../lib/names';
import { confirm } from '../lib/prompt';
import { featurePath } from '../lib/repo';
import { addScope, loadScopes } from '../lib/scopes';
import { featureDependencies } from '../lib/versions';
import { featureFiles } from '../templates/feature';

export interface FeatureOptions {
  readonly root: string;
  readonly name: string;
  /** Answers the commitlint scope question up front, for a run with no terminal. */
  readonly addScope: boolean;
  readonly install: boolean;
}

const ensureScope = async (options: FeatureOptions): Promise<void> => {
  if ((await loadScopes(options.root)).includes(options.name)) return;

  const accepted = await confirm({
    question: `Scope \u201e${options.name}\u201c v commitlint.config.js chyb\u00ed. P\u0159idat?`,
    preapproved: options.addScope,
    flag: '--add-scope',
  });
  if (!accepted) {
    throw new GeneratorError(
      `Bez scope \u201e${options.name}\u201c nejde na feature commitnout. Kon\u010d\u00edm.`,
    );
  }

  await addScope(options.root, options.name);
  report(`  ~ commitlint.config.js (scope \u201e${options.name}\u201c)`);
};

/** A new workspace package has no linked dependencies until pnpm relinks the workspace. */
const install = (root: string): void => {
  report('  \u2026 pnpm install');
  const result = spawnSync('pnpm', ['install'], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) {
    throw new GeneratorError('pnpm install selhal, feature je vygenerovan\u00e1 bez link\u016f.');
  }
};

export const generateFeature = async (options: FeatureOptions): Promise<readonly string[]> => {
  if (!isKebabCase(options.name))
    throw new GeneratorError(`N\u00e1zev \u201e${options.name}\u201c nen\u00ed kebab-case.`);
  if (existsSync(join(options.root, featurePath(options.name)))) {
    throw new GeneratorError(`Feature ${options.name} u\u017e existuje, nep\u0159episuji.`);
  }

  await ensureScope(options);

  const files = featureFiles(namesOf(options.name), await featureDependencies(options.root));
  await writeAll(options.root, files);
  if (options.install) install(options.root);

  return files.map((file) => file.path);
};
