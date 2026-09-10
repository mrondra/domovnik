import { rm } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateFeature } from '../generate/feature';
import { scaffoldRepo } from './repo.fixture';

let root: string;
let wasTty: boolean | undefined;

beforeEach(async () => {
  root = await scaffoldRepo();
  wasTty = process.stdin.isTTY;
  Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
});

afterEach(async () => {
  Object.defineProperty(process.stdin, 'isTTY', { value: wasTty, configurable: true });
  await rm(root, { recursive: true, force: true });
});

describe('gen:feature without a terminal', () => {
  it('stops on a missing commit scope instead of guessing', async () => {
    await expect(generateFeature({ root, name: 'demo', addScope: false, install: false })).rejects.toThrow(
      /--add-scope/,
    );
  });
});
