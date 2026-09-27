import { mkdir, rm, writeFile } from 'node:fs/promises';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { withTestTenant } from '../../../kernel/src/testing/index';
import { clearDemoResets, clearScenarioKinds } from '../domain/definition';
import { registerScenario, runScenario } from '../service/index';
import { startDemoWorld, type DemoWorld } from './demo.fixture';

/**
 * Sits next to a real feature, matching the glob `loadDemoModules` scans — the same door a real
 * feature's `demo/<kind>.ts` walks through, without `demo` importing anything by name (task 028).
 */
const FIXTURE_ROOT = new URL('../../__discovery_fixture__', import.meta.url).pathname;

const FIXTURE_FILE = [
  "import { defineScenarioKind } from '../../demo/domain/definition';",
  '',
  '// No real payload schema needed here: only `.parse` is ever called on it.',
  'const payload = { parse: (value) => value };',
  '',
  'export const fixtureScenario = defineScenarioKind({',
  "  kind: 'discovery_fixture',",
  "  feature: '__discovery_fixture__',",
  '  payload,',
  '  run: async (ctx, code) => ({',
  '    code,',
  "    outcome: 'ran',",
  "    message: 'the fixture feature ran itself',",
  '    link: null,',
  '  }),',
  '});',
  '',
].join('\n');

let world: DemoWorld;

beforeAll(async () => {
  world = await startDemoWorld();
}, 120_000);

afterAll(async () => {
  await world.stop();
});

afterEach(async () => {
  await rm(FIXTURE_ROOT, { recursive: true, force: true });
  clearScenarioKinds();
  clearDemoResets();
});

describe('a feature that adds demo/<kind>.ts', () => {
  it('can have its scenario run without demo naming the feature', async () => {
    await mkdir(`${FIXTURE_ROOT}/demo`, { recursive: true });
    await writeFile(`${FIXTURE_ROOT}/demo/fixture.ts`, FIXTURE_FILE, 'utf8');

    const tenant = await withTestTenant();
    await registerScenario(tenant.ctx, {
      code: 'discovery-fixture',
      title: 'Fixture',
      description: 'A scenario a temporary feature registered on its own.',
      kind: 'discovery_fixture',
      payload: {},
    });

    const result = await runScenario(tenant.ctx, 'discovery-fixture');

    expect(result.outcome).toBe('ran');
  }, 60_000);
});
