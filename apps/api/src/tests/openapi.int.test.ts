import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bodyOf, startApi, type ApiHarness } from './api.fixture';

const operationSchema = z.object({
  requestBody: z.unknown().optional(),
  responses: z.record(z.string(), z.unknown()),
});
const documentSchema = z.object({
  paths: z.record(z.string(), z.record(z.string(), operationSchema)),
});

let api: ApiHarness;
let document: z.output<typeof documentSchema>;

beforeAll(async () => {
  api = await startApi();
  document = bodyOf(await api.http().get('/openapi.json').expect(200), documentSchema);
}, 180_000);

afterAll(async () => {
  await api.stop();
});

const operation = (path: string, method: 'get' | 'post'): z.output<typeof operationSchema> | undefined =>
  document.paths[path]?.[method];

describe('the published OpenAPI document', () => {
  it('lists every route the API serves', () => {
    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining([
        '/health',
        '/auth/login',
        '/auth/me',
        '/approvals',
        '/approvals/{id}/decide',
        '/a/{token}',
        '/api-tokens',
      ]),
    );
  });

  it('describes a request body from the zod schema the endpoint validates with', () => {
    expect(operation('/auth/login', 'post')?.requestBody).toMatchObject({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: { email: { type: 'string', format: 'email' } },
          },
        },
      },
    });
  });

  it('describes a response from the zod schema the endpoint answers with', () => {
    expect(operation('/auth/login', 'post')?.responses['200']).toMatchObject({
      content: {
        'application/json': {
          schema: { type: 'object', required: ['userId', 'expiresAt'] },
        },
      },
    });
  });
});
