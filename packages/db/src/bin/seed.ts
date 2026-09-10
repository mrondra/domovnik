import { closeConnections } from '../../../kernel/src/db/index';
import { logger } from '../../../kernel/src/logger/index';
import { runSeed } from '../seed/index';

const features = await runSeed();
logger().info({ features }, 'Database is seeded');
await closeConnections();
