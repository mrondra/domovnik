import { GeneratorError, parseArgs, report, reportCreated, run } from './lib/cli';
import { generateFeature } from './generate/feature';
import { repoRoot } from './lib/repo';

const USAGE = 'pnpm gen:feature <name> [--add-scope] [--no-install]';

run(async () => {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  const [name] = positionals;
  if (name === undefined) throw new GeneratorError(`Chybí název feature.\n${USAGE}`);

  const created = await generateFeature({
    root: repoRoot(),
    name,
    addScope: flags.has('add-scope'),
    install: !flags.has('no-install'),
  });

  reportCreated(created);
  report(`Feature ${name} je připravená. Dál: schema.ts → domain → service → testy → index.ts.`);
});
