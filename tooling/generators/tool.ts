import { GeneratorError, parseArgs, reportCreated, run } from './lib/cli';
import { generateTool } from './generate/tool';
import { repoRoot } from './lib/repo';

const USAGE = 'pnpm gen:tool <feature> <name> [--approval]';

run(async () => {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  const [feature, name] = positionals;
  if (feature === undefined || name === undefined) throw new GeneratorError(`Chybí argument.\n${USAGE}`);

  reportCreated(
    await generateTool({
      root: repoRoot(),
      feature,
      name,
      requiresApproval: flags.has('approval'),
    }),
  );
});
