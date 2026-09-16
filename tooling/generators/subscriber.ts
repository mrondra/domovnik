import { GeneratorError, parseArgs, report, reportCreated, run } from './lib/cli';
import { generateSubscriber } from './generate/subscriber';
import { repoRoot } from './lib/repo';

const USAGE = 'pnpm gen:subscriber <feature> <event-name> <subscriber-name>';

run(async () => {
  const { positionals } = parseArgs(process.argv.slice(2));
  const [feature, event, name] = positionals;
  if (feature === undefined || event === undefined || name === undefined) {
    throw new GeneratorError(`Chybí argument.\n${USAGE}`);
  }

  reportCreated(await generateSubscriber({ root: repoRoot(), feature, event, name }));
  report('Dál: handler volá service feature a je idempotentní; workers ho najdou globem.');
});
