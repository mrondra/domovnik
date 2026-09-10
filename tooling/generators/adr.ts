import { parseArgs, reportCreated, run } from './lib/cli';
import { generateAdr } from './generate/adr';
import { repoRoot } from './lib/repo';

run(async () => {
  const { positionals } = parseArgs(process.argv.slice(2));
  reportCreated([await generateAdr(repoRoot(), positionals.join(' ').trim())]);
});
