import { triggerEvent, type AgentInput } from './agent-names';

const RESULT = 'Hotovo: dávka je zpracovaná.';

/**
 * Two recorded answers: the harness first asks the model to name the session, then answers the
 * trigger. Add a `tool_use` exchange the moment the agent gets its first tool.
 */
export const replayFixture = (): string =>
  `${JSON.stringify(
    {
      exchanges: [
        {
          name: 'session-title',
          when: { contains: ['naming a coding session'] },
          message: {
            id: 'msg_title',
            model: 'claude-sonnet-5',
            content: [{ type: 'text', text: '{"title":"Dávka"}' }],
            stopReason: 'end_turn',
            inputTokens: 10,
            outputTokens: 5,
          },
        },
        {
          name: 'final-answer',
          when: { contains: ['Spouštěč:'] },
          message: {
            id: 'msg_final',
            model: 'claude-sonnet-5',
            content: [{ type: 'text', text: RESULT }],
            stopReason: 'end_turn',
            inputTokens: 1200,
            outputTokens: 30,
          },
        },
      ],
    },
    null,
    2,
  )}\n`;

export const agentIntTest = (
  input: AgentInput,
): string => `import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  replayLlm,
  runAgentInTest,
  startTestDb,
  withTestTenant,
  type TestDatabase,
  type TestTenant,
} from '../../../kernel/src/testing/index';
import { ${input.agent.camel}Agent } from '../agents/${input.agent.kebab}/agent';

const FIXTURE = new URL('../fixtures/llm/${input.agent.kebab}/replay.json', import.meta.url).pathname;

let database: TestDatabase;
let tenant: TestTenant;

beforeAll(async () => {
  database = await startTestDb();
  tenant = await withTestTenant();
}, 120_000);

afterAll(async () => {
  await database.stop();
});

describe('agent ${input.agent.kebab}', () => {
  it('drives the run from the recorded model answers', async () => {
    const result = await runAgentInTest(
      tenant.ctx,
      ${input.agent.camel}Agent,
      { kind: 'event', name: '${triggerEvent(input)}', payload: { ids: [] } },
      { llm: replayLlm(FIXTURE), maxTurns: 4 },
    );

    expect(result.status).toBe('succeeded');
    expect(result.result).toContain('${RESULT}');
  }, 120_000);
});
`;
