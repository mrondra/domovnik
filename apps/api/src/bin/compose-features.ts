import { logger } from '../../../../packages/kernel/src/logger/index';
import { composeModules, featureModuleFiles } from '../features/compose';

await composeModules();
logger().info({ features: (await featureModuleFiles()).length }, 'Feature modules composed');
