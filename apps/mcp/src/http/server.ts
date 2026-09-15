import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { pingDatabase } from '../../../../packages/kernel/src/db/index';
import { toHttpStatus } from '../../../../packages/kernel/src/errors/index';
import { logger } from '../../../../packages/kernel/src/logger/index';
import { authenticate, createMcpServer } from '../server/index';
import { errorBody, healthBody, notFoundBody, NOT_FOUND } from './responses';

const MCP_PATH = '/mcp';
const HEALTH_PATH = '/health';

/**
 * Stateless: a fresh server and transport per request. The tool set follows from the token, so a
 * session that outlived a revoked role would be a session showing tools its owner no longer has.
 */
const handleMcp = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
  const principal = await authenticate(request.headers.authorization);
  const server = createMcpServer(principal);
  // No `sessionIdGenerator` is what puts the transport in stateless mode.
  const transport = new StreamableHTTPServerTransport({});

  response.on('close', () => {
    void transport.close();
    void server.close();
  });

  // @ts-expect-error The SDK types Transport's optional callbacks as `T | undefined` getters, which
  // exactOptionalPropertyTypes rejects. Nothing about the runtime contract differs.
  await server.connect(transport);
  await transport.handleRequest(request, response);
};

const handleHealth = async (response: ServerResponse): Promise<void> => {
  await pingDatabase();
  response.writeHead(200, { 'content-type': 'application/json' }).end(healthBody());
};

const route = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
  if (request.url?.startsWith(HEALTH_PATH) === true) return handleHealth(response);
  if (request.url?.startsWith(MCP_PATH) === true) return handleMcp(request, response);

  response.writeHead(NOT_FOUND, { 'content-type': 'application/json' }).end(notFoundBody());
};

const fail = (response: ServerResponse, error: unknown): void => {
  logger().warn({ error }, 'MCP request refused');
  if (response.headersSent) return;

  const status = toHttpStatus(error);
  response.writeHead(status, { 'content-type': 'application/json' }).end(errorBody(error));
};

export const startMcpServer = (port: number): Server =>
  createServer((request, response) => {
    void route(request, response).catch((error: unknown) => {
      fail(response, error);
    });
  }).listen(port, '0.0.0.0');
