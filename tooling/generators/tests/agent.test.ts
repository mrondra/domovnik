import { rm } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateAgent } from '../generate/agent';
import { generateFeature } from '../generate/feature';
import { readGenerated, scaffoldRepo } from './repo.fixture';

let root: string;

beforeEach(async () => {
  root = await scaffoldRepo();
  await generateFeature({ root, name: 'demo', addScope: true, install: false });
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('gen:agent', () => {
  it('writes the definition, the prompt, the fixture and the replay test', async () => {
    const created = await generateAgent({ root, feature: 'demo', name: 'record-triage' });

    expect(created).toEqual([
      'packages/features/demo/agents/record-triage/agent.ts',
      'packages/features/demo/agents/record-triage/prompt.md',
      'packages/features/demo/fixtures/llm/record-triage/replay.json',
      'packages/features/demo/tests/record-triage.agent.int.test.ts',
    ]);
  });

  it('writes a Czech prompt with the required sections', async () => {
    await generateAgent({ root, feature: 'demo', name: 'record-triage' });

    const prompt = await readGenerated(root, 'packages/features/demo/agents/record-triage/prompt.md');
    for (const section of ['## Role', '## Kontext', '## Postup', '## Pravidla', '## Výstup']) {
      expect(prompt).toContain(section);
    }
  });

  it('triggers on a batched event, not on one item', async () => {
    await generateAgent({ root, feature: 'demo', name: 'record-triage' });

    const agent = await readGenerated(root, 'packages/features/demo/agents/record-triage/agent.ts');
    expect(agent).toContain("event: 'demo.records.pending'");
  });

  it('refuses an agent for a feature that does not exist', async () => {
    await expect(generateAgent({ root, feature: 'missing', name: 'triage' })).rejects.toThrow(/neexistuje/);
  });
});
