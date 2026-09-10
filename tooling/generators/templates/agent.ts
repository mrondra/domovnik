import type { GeneratedFile } from '../lib/files';
import { featurePath } from '../lib/repo';
import { agentPrompt } from './agent-prompt';
import { agentIntTest, replayFixture } from './agent-test';
import { triggerEvent, type AgentInput } from './agent-names';

export const agentTs = (
  input: AgentInput,
): string => `import { defineAgent, promptFromFile } from '../../../../kernel/src/agents/index';

/**
 * Defining the agent registers it (ADR 0008). The trigger is a batched event carrying the residual
 * the deterministic code could not settle — never one event per item (ADR 0004).
 */
export const ${input.agent.camel}Agent = defineAgent({
  name: '${input.agent.kebab}',
  version: '1.0.0',
  description: 'Doplň: co agent řeší a co po sobě nechává.',
  triggers: [{ event: '${triggerEvent(input)}' }],
  scope: 'svj',
  model: 'sonnet',
  tools: [],
  autonomy: 'read',
  prompt: promptFromFile(new URL('./prompt.md', import.meta.url)),
  roles: ['manager'],
});
`;

export const agentFiles = (input: AgentInput): readonly GeneratedFile[] => {
  const at = (relative: string): string => `${featurePath(input.feature.kebab)}/${relative}`;

  return [
    { path: at(`agents/${input.agent.kebab}/agent.ts`), contents: agentTs(input) },
    { path: at(`agents/${input.agent.kebab}/prompt.md`), contents: agentPrompt(input) },
    { path: at(`fixtures/llm/${input.agent.kebab}/replay.json`), contents: replayFixture() },
    { path: at(`tests/${input.agent.kebab}.agent.int.test.ts`), contents: agentIntTest(input) },
  ];
};
