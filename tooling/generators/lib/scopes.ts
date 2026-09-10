import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { GeneratorError } from './cli';
import { formatSource } from './format';

const CONFIG = 'commitlint.config.js';
const QUOTED = /'([^']+)'/g;

const bodyBounds = (source: string): { readonly start: number; readonly end: number } => {
  const anchor = source.indexOf("'scope-enum'");
  const start = anchor === -1 ? -1 : source.indexOf('[', source.indexOf("'always'", anchor));
  if (start === -1) throw new GeneratorError(`V ${CONFIG} chybí pole scope-enum.`);

  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === '[') depth += 1;
    if (source[index] === ']') {
      depth -= 1;
      if (depth === 0) return { start: start + 1, end: index };
    }
  }
  throw new GeneratorError(`Pole scope-enum v ${CONFIG} není uzavřené.`);
};

export const readScopes = (source: string): readonly string[] => {
  const { start, end } = bodyBounds(source);
  return [...source.slice(start, end).matchAll(QUOTED)].map(([, scope]) => scope ?? '');
};

/** Commit scopes are the feature list; a generated feature nobody can commit to is half-generated. */
export const addScope = async (root: string, scope: string): Promise<void> => {
  const path = join(root, CONFIG);
  const source = await readFile(path, 'utf8');
  const { start, end } = bodyBounds(source);
  const body = source.slice(start, end).trimEnd();
  const separator = body === '' || body.endsWith(',') ? '' : ',';
  const updated = `${source.slice(0, end)}${separator}'${scope}',${source.slice(end)}`;
  await writeFile(path, await formatSource(path, updated), 'utf8');
};

export const loadScopes = async (root: string): Promise<readonly string[]> =>
  readScopes(await readFile(join(root, CONFIG), 'utf8'));
