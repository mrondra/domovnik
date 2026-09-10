import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { GeneratorError } from '../lib/cli';
import { writeAll } from '../lib/files';
import { slugify } from '../lib/names';
import { adrMarkdown } from '../templates/adr';

const DIRECTORY = 'docs/adr';
const NUMBERED = /^(\d{4})-/;

const nextNumber = async (root: string): Promise<string> => {
  const entries = await readdir(join(root, DIRECTORY));
  const used = entries.flatMap((entry) => NUMBERED.exec(entry)?.[1] ?? []);
  const highest = used.reduce((max, current) => Math.max(max, Number(current)), 0);
  return String(highest + 1).padStart(4, '0');
};

export const generateAdr = async (root: string, title: string): Promise<string> => {
  if (title.trim() === '') throw new GeneratorError('Chyb\u00ed n\u00e1zev ADR.');

  const slug = slugify(title);
  if (slug === '') throw new GeneratorError(`Z n\u00e1zvu \u201e${title}\u201c nejde ud\u011blat slug.`);

  const number = await nextNumber(root);
  const template = await readFile(join(root, DIRECTORY, 'template.md'), 'utf8');
  const path = `${DIRECTORY}/${number}-${slug}.md`;

  await writeAll(root, [
    {
      path,
      contents: adrMarkdown({ number, title, date: new Date().toISOString().slice(0, 10), template }),
    },
  ]);

  return path;
};
