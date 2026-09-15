import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadToolsFrom } from '../../../packages/kernel/src/tools/index';

const TOOL_FILES = 'packages/features/*/tools/*.ts';

const repoRoot = (): string => fileURLToPath(new URL('../../../', import.meta.url));

/**
 * The MCP server exposes the same registry as the REST API and the agents, so it discovers tools the
 * same way the workers do: importing the file is what registers it (AGENTS.md §2).
 */
export const loadFeatureTools = (): Promise<number> => loadToolsFrom([join(repoRoot(), TOOL_FILES)]);
