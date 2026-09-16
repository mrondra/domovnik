import { rm } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateFeature } from '../generate/feature';
import { generateSubscriber } from '../generate/subscriber';
import { readGenerated, scaffoldRepo } from './repo.fixture';

let root: string;

beforeEach(async () => {
  root = await scaffoldRepo();
  await generateFeature({ root, name: 'demo', addScope: true, install: false });
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const generate = (event: string, name: string): Promise<readonly string[]> =>
  generateSubscriber({ root, feature: 'demo', event, name });

describe('gen:subscriber', () => {
  it('writes the subscriber and its integration test', async () => {
    const created = await generate('finance.invoice.approved', 'contract-archive');

    expect(created).toEqual([
      'packages/features/demo/subscribers/contract-archive.ts',
      'packages/features/demo/tests/contract-archive.int.test.ts',
    ]);
  });

  it('names the handler after the feature and subscribes it to the event', async () => {
    await generate('finance.invoice.approved', 'contract-archive');

    const source = await readGenerated(root, 'packages/features/demo/subscribers/contract-archive.ts');
    expect(source).toContain('export const demoContractArchive = subscribe(');
    expect(source).toContain("'finance.invoice.approved'");
    expect(source).toContain("subscriber: 'demo.contract-archive'");
  });

  it('asserts the queue name in the generated test', async () => {
    await generate('tick.daily', 'nightly-close');

    const test = await readGenerated(root, 'packages/features/demo/tests/nightly-close.int.test.ts');
    expect(test).toContain("toBe('tick.daily/demo.nightly-close')");
  });

  it('refuses an event name that is not domena.entita.akce', async () => {
    await expect(generate('InvoiceApproved', 'contract-archive')).rejects.toThrow(/domena.entita.akce/);
  });

  it('refuses a subscriber for a feature that does not exist', async () => {
    await expect(
      generateSubscriber({ root, feature: 'missing', event: 'tick.daily', name: 'nightly-close' }),
    ).rejects.toThrow(/neexistuje/);
  });

  it('refuses to overwrite an existing subscriber', async () => {
    await generate('tick.daily', 'nightly-close');

    await expect(generate('tick.daily', 'nightly-close')).rejects.toThrow(/nepřepisuji/);
  });
});
