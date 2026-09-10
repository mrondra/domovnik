import { rm } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateAdr } from '../generate/adr';
import { readGenerated, scaffoldRepo } from './repo.fixture';

let root: string;

beforeEach(async () => {
  root = await scaffoldRepo();
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('adr:new', () => {
  it('takes the next free number and a slug from the title', async () => {
    const path = await generateAdr(root, 'Účtování v Pohodě');

    expect(path).toBe('docs/adr/0003-uctovani-v-pohode.md');
  });

  it('starts the record as Proposed and dated today', async () => {
    const path = await generateAdr(root, 'Second try');
    const adr = await readGenerated(root, path);

    expect(adr).toContain('# 0003 – Second try');
    expect(adr).toContain('- Status: Proposed');
    expect(adr).toContain(`- Date: ${new Date().toISOString().slice(0, 10)}`);
  });

  it('rejects a title with nothing to slug', async () => {
    await expect(generateAdr(root, '???')).rejects.toThrow(/slug/);
  });
});
