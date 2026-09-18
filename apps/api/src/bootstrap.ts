import multipart from '@fastify/multipart';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadEnv } from '../../../packages/kernel/src/env/index';
import { logger } from '../../../packages/kernel/src/logger/index';
import { AppModule } from './app.module';
import { registerRequestContext } from './http/context-hook';
import { validationPipe } from './http/validation';
import { buildOpenApiDocument, OPENAPI_PATH } from './openapi/document';

/**
 * A signed approval link is a route parameter carrying a base64url payload and its HMAC — some 300
 * characters, well past Fastify's 100-character default, which answers 414 without reaching a route.
 */
const SIGNED_LINK_PARAM_LENGTH = 1024;

/** An invoice scan. Big enough for a scanned page, small enough that nobody uploads a film. */
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

const adapter = (): FastifyAdapter =>
  new FastifyAdapter({ routerOptions: { maxParamLength: SIGNED_LINK_PARAM_LENGTH } });

/**
 * Shared by `main.ts` and the end-to-end tests, so what the tests exercise is the application that
 * actually runs — including the request-context hook, which is registered on Fastify itself rather
 * than as Nest middleware (see `http/context-hook.ts`).
 */
export const buildApp = async (): Promise<NestFastifyApplication> => {
  loadEnv();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter(), {
    logger: false,
  });

  await app.register(multipart, { limits: { fileSize: MAX_UPLOAD_BYTES, files: 4 } });
  registerRequestContext(app.getHttpAdapter().getInstance());
  app.useGlobalPipes(validationPipe());

  await app.init();
  const document = buildOpenApiDocument(app);
  app
    .getHttpAdapter()
    .getInstance()
    .get(OPENAPI_PATH, () => document);

  logger().debug({ paths: Object.keys(document.paths).length }, 'OpenAPI document built');
  return app;
};
