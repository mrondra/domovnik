import { logger } from '../../../kernel/src/logger/index';
import { runGenerate } from '../generate';

const created = await runGenerate();
logger().info({ created }, created.length === 0 ? 'Schema unchanged' : 'Migration generated');
