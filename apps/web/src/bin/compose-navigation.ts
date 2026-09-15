import { composeNavigation, featureNavigationFiles } from '../navigation/compose';

await composeNavigation();
process.stdout.write(
  `Navigation composed from ${String((await featureNavigationFiles()).length)} features\n`,
);
