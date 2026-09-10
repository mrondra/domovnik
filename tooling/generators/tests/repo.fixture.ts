import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { repoRoot } from '../lib/repo';

const REPO = repoRoot();

/** Written rather than copied: the real scope list grows, and these tests assert on its contents. */
const COMMITLINT_CONFIG = `export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['kernel', 'invoices']],
    'subject-case': [2, 'always', 'lower-case'],
  },
};
`;

/**
 * The smallest repository a generator needs: the Prettier config it formats with, the commit scopes
 * it checks against, the kernel manifest it reads versions from and the ADR template.
 */
export const scaffoldRepo = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'domovnik-generators-'));

  await mkdir(join(root, 'docs/adr'), { recursive: true });
  await mkdir(join(root, 'packages/kernel'), { recursive: true });

  await Promise.all([
    cp(join(REPO, '.prettierrc'), join(root, '.prettierrc')),
    writeFile(join(root, 'commitlint.config.js'), COMMITLINT_CONFIG),
    cp(join(REPO, 'docs/adr/template.md'), join(root, 'docs/adr/template.md')),
    cp(join(REPO, 'packages/kernel/package.json'), join(root, 'packages/kernel/package.json')),
    writeFile(join(root, 'docs/adr/0001-first.md'), '# 0001\n'),
    writeFile(join(root, 'docs/adr/0002-second.md'), '# 0002\n'),
  ]);

  return root;
};

export const readGenerated = (root: string, path: string): Promise<string> =>
  readFile(join(root, path), 'utf8');
