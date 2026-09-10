import { GeneratorError, parseArgs, report, reportCreated, run } from './lib/cli';
import { generateAgent } from './generate/agent';
import { repoRoot } from './lib/repo';

const USAGE = 'pnpm gen:agent <feature> <name>';

run(async () => {
  const { positionals } = parseArgs(process.argv.slice(2));
  const [feature, name] = positionals;
  if (feature === undefined || name === undefined) throw new GeneratorError(`Chybí argument.\n${USAGE}`);

  reportCreated(await generateAgent({ root: repoRoot(), feature, name }));
  report('Dál: prompt.md, tooly do `tools`, a rozšiř replay fixture o volání toolů.');
});
