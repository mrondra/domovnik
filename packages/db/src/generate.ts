import { execFile } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { composeSchema } from './compose';
import { decorateMigration } from './decorate';
import { composedSchemaFile, migrationsFolder, packageRoot } from './paths';

const run = promisify(execFile);

const drizzleKit = (): string => join(packageRoot(), 'node_modules/.bin/drizzle-kit');

const migrationFiles = async (): Promise<readonly string[]> => {
  const entries = await readdir(migrationsFolder()).catch(() => []);
  return entries.filter((entry) => entry.endsWith('.sql')).sort((a, b) => a.localeCompare(b));
};

const decorateFile = async (name: string): Promise<void> => {
  const target = join(migrationsFolder(), name);
  await writeFile(target, decorateMigration(await readFile(target, 'utf8')), 'utf8');
};

/**
 * Composes the schema, lets Drizzle Kit diff it, then decorates whatever it wrote. The schema is
 * imported dynamically **after** composing, so a feature added in this very run is registered
 * before `decorateMigration` asks the table registry which tables are tenant-scoped.
 */
export const runGenerate = async (): Promise<readonly string[]> => {
  await composeSchema();
  await import(pathToFileURL(composedSchemaFile()).href);

  const before = await migrationFiles();
  await run(drizzleKit(), ['generate'], { cwd: packageRoot() });
  const created = (await migrationFiles()).filter((name) => !before.includes(name));

  await Promise.all(created.map(decorateFile));
  return created;
};
