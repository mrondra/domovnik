import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import type { Response } from 'supertest';
import type TestAgent from 'supertest/lib/agent';
import { z } from 'zod';
import { createContext } from '../../../../packages/kernel/src/context/index';
import { createSession, createUser } from '../../../../packages/kernel/src/identity/index';
import type { Role } from '../../../../packages/kernel/src/identity/index';
import type { SvjId, TenantId, UserId } from '../../../../packages/kernel/src/ids/index';
import type { RequestContext } from '../../../../packages/kernel/src/context/index';
import { startTestDb, withTestTenant } from '../../../../packages/kernel/src/testing/index';
import type { TestDatabase, TestTenant } from '../../../../packages/kernel/src/testing/index';
import { buildApp } from '../bootstrap';
import { SESSION_COOKIE } from '../http/credentials';

export interface ApiHarness {
  readonly app: NestFastifyApplication;
  readonly database: TestDatabase;
  readonly tenant: TestTenant;
  http(): TestAgent;
  stop(): Promise<void>;
}

/** The application under test is the one `main.ts` starts — same modules, same hook, same filter. */
export const startApi = async (): Promise<ApiHarness> => {
  const database = await startTestDb();
  const tenant = await withTestTenant();
  const app = await buildApp();
  await app.getHttpAdapter().getInstance().ready();

  return {
    app,
    database,
    tenant,
    http: () => request(app.getHttpServer()),
    stop: async () => {
      await app.close();
      await database.stop();
    },
  };
};

export interface Person {
  readonly userId: UserId;
  readonly email: string;
  readonly password: string;
}

const PASSWORD = 'heslo-12345';

export const addPerson = async (
  tenantId: TenantId,
  email: string,
  roles: readonly Role[],
  svjId?: SvjId,
): Promise<Person> => {
  const ctx = createContext({ tenantId, actor: { type: 'system', id: null, roles: [] } });
  const userId = await createUser(ctx, {
    email,
    displayName: email,
    password: PASSWORD,
    roles,
    ...(svjId === undefined ? {} : { svjId }),
  });
  return { userId, email, password: PASSWORD };
};

/** supertest keeps no cookie jar of its own; the tests carry the session header explicitly. */
export const sessionHeader = (setCookie: string | readonly string[] | undefined): string => {
  const entries = typeof setCookie === 'string' ? [setCookie] : (setCookie ?? []);
  const cookie = entries.find((entry) => entry.startsWith(`${SESSION_COOKIE}=`));
  return cookie?.split(';')[0] ?? '';
};

/** For an app that has no `/auth/login` of its own: the same cookie, issued through the kernel. */
export const sessionCookieFor = async (ctx: RequestContext, userId: UserId): Promise<string> => {
  const { token } = await createSession(ctx, userId);
  return `${SESSION_COOKIE}=${token}`;
};

export const signIn = async (harness: ApiHarness, person: Person): Promise<string> => {
  const response = await harness
    .http()
    .post('/auth/login')
    .send({ email: person.email, password: person.password })
    .expect(200);
  return sessionHeader(response.get('set-cookie'));
};

const errorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
    correlationId: z.string().min(1),
  }),
});

/**
 * A supertest body is `any`. Parsing it against a schema costs nothing and turns every assertion
 * into a check of the published contract rather than a poke at an untyped object.
 */
export const bodyOf = <S extends z.ZodType>(response: Response, schema: S): z.output<S> =>
  schema.parse(response.body);

export const errorOf = (response: Response): z.output<typeof errorBodySchema>['error'] =>
  bodyOf(response, errorBodySchema).error;

export const idsOf = (response: Response): readonly string[] =>
  bodyOf(response, z.array(z.object({ id: z.uuid() }))).map((row) => row.id);
