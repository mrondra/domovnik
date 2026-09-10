import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { formatSource } from './format';
import { GeneratorError } from './cli';

export interface GeneratedFile {
  /** Repository-relative, always with forward slashes. */
  readonly path: string;
  readonly contents: string;
}

/**
 * Writes the whole batch or nothing. A generator that overwrites is a generator nobody dares run
 * twice, so an existing target is an error, not a merge.
 */
export const writeAll = async (root: string, files: readonly GeneratedFile[]): Promise<void> => {
  const existing = files.filter((file) => existsSync(join(root, file.path)));
  if (existing.length > 0) {
    throw new GeneratorError(`Už existuje, nepřepisuji: ${existing.map((file) => file.path).join(', ')}`);
  }

  await Promise.all(
    files.map(async (file) => {
      const target = join(root, file.path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, await formatSource(target, file.contents), 'utf8');
    }),
  );
};
