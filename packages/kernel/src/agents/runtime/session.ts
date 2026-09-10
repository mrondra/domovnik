import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { query, type Options, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { inheritedEnv } from '../../env/index';
import { logger } from '../../logger/index';
import { resolveModel } from '../../llm/models';
import type { ModelAlias } from '../../tools/definition';
import type { McpSdkServerConfigWithInstance } from '@anthropic-ai/claude-agent-sdk';
import type { AgentDefinition } from '../definition';
import { MCP_SERVER_NAME, qualifiedName } from './tool-bridge';
import { budgetExceeded, outcomeOf, unfinishedOutcome, type Usage } from './outcome';
import type { AgentTrigger, RunOutcome } from './types';

const DEFAULT_MAX_TURNS = 20;

const triggerPrompt = (trigger: AgentTrigger): string =>
  [`Spouštěč: ${trigger.kind} – ${trigger.name}`, 'Payload:', JSON.stringify(trigger.payload, null, 2)].join(
    '\n',
  );

const consume = (message: SDKMessage, usage: Usage): void => {
  if (message.type !== 'assistant') return;
  usage.input += message.message.usage.input_tokens;
  usage.output += message.message.usage.output_tokens;
};

const drive = async (prompt: string, options: Options, tokenBudget: number): Promise<RunOutcome> => {
  const usage: Usage = { input: 0, output: 0 };
  let outcome: RunOutcome | undefined;

  for await (const message of query({ prompt, options })) {
    consume(message, usage);

    if (usage.input + usage.output > tokenBudget) {
      outcome = budgetExceeded(usage, tokenBudget);
      break;
    }
    if (message.type === 'result') outcome = outcomeOf(message);
  }

  return outcome ?? unfinishedOutcome(usage);
};

export interface SessionInput {
  readonly definition: AgentDefinition;
  readonly model: ModelAlias;
  readonly trigger: AgentTrigger;
  readonly server: McpSdkServerConfigWithInstance;
  readonly maxTurns?: number | undefined;
  readonly tokenBudget: number;
}

/**
 * The harness reads project files and memory from its working directory; a fresh empty one keeps a
 * tenant's agent run out of whatever happens to sit on the server's disk (ADR 0012).
 */
export const runSession = async (input: SessionInput): Promise<RunOutcome> => {
  const workspace = await mkdtemp(join(tmpdir(), 'domovnik-agent-'));
  const options: Options = {
    model: resolveModel(input.model),
    systemPrompt: input.definition.prompt,
    mcpServers: { [MCP_SERVER_NAME]: input.server },
    allowedTools: input.definition.tools.map(qualifiedName),
    tools: [],
    settingSources: [],
    cwd: workspace,
    maxTurns: input.maxTurns ?? DEFAULT_MAX_TURNS,
    env: inheritedEnv(),
    stderr: (data) => {
      logger().debug({ agent: input.definition.name }, data);
    },
  };

  return drive(triggerPrompt(input.trigger), options, input.tokenBudget).finally(() =>
    rm(workspace, { recursive: true, force: true }),
  );
};
