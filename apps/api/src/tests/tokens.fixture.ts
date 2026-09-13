import { z } from 'zod';
import { clearTools, defineTool } from '../../../../packages/kernel/src/tools/index';
import { bodyOf, type ApiHarness } from './api.fixture';

/**
 * Three tools on purpose: two a `manager` may use (`comms.*`, `tasks.*`) and one they may not
 * (`finance.*`). That is what separates "the token is narrower than its owner" from "the owner is
 * narrower than the registry" — the two refusals in zadání kap. 9.
 */
export const registerTokenTools = (): void => {
  clearTools();
  for (const [name, permission] of [
    ['letter.send', 'comms.send'],
    ['task.close', 'tasks.close'],
    ['payment.create', 'finance.pay'],
  ] as const) {
    defineTool({
      name,
      description: `Nástroj ${name}.`,
      input: z.object({}),
      output: z.object({ done: z.boolean() }),
      permission,
      approval: () => ({ required: true, approvers: [] }),
      userComposable: true,
      readOnly: false,
      handler: () => Promise.resolve({ done: true }),
    });
  }
};

export const issuedTokenSchema = z.object({ id: z.uuid(), token: z.string().min(1) });

export const issueToken = async (
  api: ApiHarness,
  cookie: string,
  allowedTools: readonly string[],
): Promise<z.output<typeof issuedTokenSchema>> => {
  const response = await api
    .http()
    .post('/api-tokens')
    .set('cookie', cookie)
    .send({ name: 'MCP', allowedTools })
    .expect(201);
  return bodyOf(response, issuedTokenSchema);
};
