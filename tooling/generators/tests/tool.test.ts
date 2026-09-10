import { rm } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateFeature } from '../generate/feature';
import { generateTool } from '../generate/tool';
import { readGenerated, scaffoldRepo } from './repo.fixture';

let root: string;

beforeEach(async () => {
  root = await scaffoldRepo();
  await generateFeature({ root, name: 'demo', addScope: true, install: false });
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const generate = (name: string, requiresApproval: boolean): Promise<readonly string[]> =>
  generateTool({ root, feature: 'demo', name, requiresApproval });

describe('gen:tool', () => {
  it('writes the tool and its unit test', async () => {
    const created = await generate('ping', false);

    expect(created).toEqual([
      'packages/features/demo/tools/ping.ts',
      'packages/features/demo/tests/ping.tool.test.ts',
    ]);
    expect(await readGenerated(root, 'packages/features/demo/tools/ping.ts')).toContain("name: 'demo.ping'");
  });

  it('adds an approval policy and a runtime test with --approval', async () => {
    const created = await generate('create-order', true);

    expect(created).toContain('packages/features/demo/tests/create-order.tool.int.test.ts');
    const tool = await readGenerated(root, 'packages/features/demo/tools/create-order.ts');
    expect(tool).toContain("name: 'demo.createOrder'");
    expect(tool).toContain('required: true');
  });

  it('refuses a tool for a feature that does not exist', async () => {
    await expect(
      generateTool({ root, feature: 'missing', name: 'ping', requiresApproval: false }),
    ).rejects.toThrow(/neexistuje/);
  });

  it('refuses to overwrite an existing tool', async () => {
    await generate('ping', false);

    await expect(generate('ping', false)).rejects.toThrow(/nepřepisuji/);
  });
});
