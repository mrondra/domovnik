import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';

export const OPENAPI_PATH = '/openapi.json';

/**
 * The document is served as JSON only. Swagger's own UI would pull in `@fastify/static` to serve
 * assets, and an API that the web app and the MCP server consume does not need a second UI.
 */
export const buildOpenApiDocument = (app: INestApplication): OpenAPIObject =>
  SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Domovník API')
      .setDescription('Procesní a agentní vrstva nad účetnictvím správcovské firmy.')
      .setVersion('0.1')
      .addCookieAuth('domovnik_session')
      .addBearerAuth({ type: 'http', scheme: 'bearer' }, 'api-token')
      .build(),
  );
