import { closeConnections } from '../../../packages/kernel/src/db/index';
import { loadEnv } from '../../../packages/kernel/src/env/index';
import { logger } from '../../../packages/kernel/src/logger/index';
import { startMcpServer } from './http/server';
import { loadFeatureTools } from './tool-registry';

const PORT = 3003;

const start = async (): Promise<void> => {
  loadEnv();
  const tools = await loadFeatureTools();
  const server = startMcpServer(PORT);

  process.on('SIGTERM', () => {
    server.close(() => {
      void closeConnections();
    });
  });

  logger().info({ port: PORT, tools }, 'MCP server listening');
};

void start();
