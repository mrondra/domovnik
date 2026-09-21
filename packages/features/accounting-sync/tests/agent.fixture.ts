import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadToolsFrom } from '../../../kernel/src/tools/index';

const TEMPLATE = new URL('./fixtures/accounting-sync-guard.replay.json', import.meta.url).pathname;
const REPO_ROOT = new URL('../../../../', import.meta.url).pathname;

/** Every feature's tools, found the same way `apps/workers` finds them (task 017). */
export const loadEveryTool = (): Promise<number> =>
  loadToolsFrom([join(REPO_ROOT, 'packages/features/*/tools/*.ts')]);

/**
 * The recorded conversation, with the ids of this run written into it. A fixture is matched by
 * request content, and the content carries ids that only exist once the test has created them —
 * so the template names them and this fills them in (task 022).
 */
export const replayFixtureFor = async (replacements: Readonly<Record<string, string>>): Promise<string> => {
  const template = await readFile(TEMPLATE, 'utf8');
  const filled = Object.entries(replacements).reduce(
    (text, [name, value]) => text.replaceAll(name, value),
    template,
  );

  const directory = await mkdtemp(join(tmpdir(), 'domovnik-replay-'));
  const path = join(directory, 'accounting-sync-guard.replay.json');
  await writeFile(path, filled, 'utf8');
  return path;
};
