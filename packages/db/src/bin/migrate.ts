import { closeConnections } from '../../../kernel/src/db/index';
import { logger } from '../../../kernel/src/logger/index';
import { runMigrations } from '../migrate';

const applied = await runMigrations();
logger().info({ applied }, 'Database is up to date');
await closeConnections();
