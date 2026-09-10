import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

/**
 * A directory with an `index.ts` is a module someone will have to orient themselves in. It gets a
 * README.md next to it saying what it is for and what the files in it do — kept out of the code so
 * the description does not have to travel with a refactor. A package's `src` is documented by the
 * README at the package root, where a reader looks for it.
 */
export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'a directory with an index.ts has a README.md (AGENTS.md §2)' },
    schema: [],
  },
  create(context) {
    return {
      Program(node) {
        const directory = dirname(context.filename);
        const documented =
          existsSync(join(directory, 'README.md')) ||
          (basename(directory) === 'src' && existsSync(join(directory, '..', 'README.md')));
        if (documented) return;
        context.report({ node, message: `Missing README.md in ${directory}.` });
      },
    };
  },
};
