import type { SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';
import type { RunOutcome } from './types';

export interface Usage {
  input: number;
  output: number;
}

const spent = (usage: Usage) => ({ inputTokens: usage.input, outputTokens: usage.output });

export const outcomeOf = (message: SDKResultMessage): RunOutcome => ({
  status: message.subtype === 'success' ? 'succeeded' : 'failed',
  result: message.subtype === 'success' ? message.result : '',
  usage: {
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  },
  costUsd: message.total_cost_usd,
  ...(message.subtype === 'success' ? {} : { error: message.subtype }),
});

export const budgetExceeded = (usage: Usage, tokenBudget: number): RunOutcome => ({
  status: 'failed_budget',
  result: '',
  usage: spent(usage),
  costUsd: 0,
  error: `Překročen rozpočet ${String(tokenBudget)} tokenů`,
});

export const unfinishedOutcome = (usage: Usage): RunOutcome => ({
  status: 'failed',
  result: '',
  usage: spent(usage),
  costUsd: 0,
  error: 'Agent skončil bez výsledku',
});
