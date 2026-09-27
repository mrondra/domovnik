import { composeDemoRegistries } from './generate/demo-registry';
import { report, run } from './lib/cli';

run(async () => {
  const written = await composeDemoRegistries();
  report(written.map((path) => `  ~ ${path}`).join('\n'));
});
