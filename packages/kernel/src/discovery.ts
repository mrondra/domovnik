import { glob } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const importAll = async (patterns: readonly string[]): Promise<number> => {
  const modules: string[] = [];
  for (const pattern of patterns) {
    for await (const entry of glob(pattern)) {
      modules.push(entry);
    }
  }
  await Promise.all(modules.map((file) => import(pathToFileURL(file).href)));
  return modules.length;
};

/** Importing a tool file registers it; the registry needs no explicit list. */
export const loadToolsFrom = (patterns: readonly string[]): Promise<number> => importAll(patterns);

/** Same for agents: a new agent is a new directory, nothing else (ADR 0008). */
export const loadAgentsFrom = (patterns: readonly string[]): Promise<number> => importAll(patterns);

/** And for feature subscribers, so an event handler is a file and nothing else (ADR 0004). */
export const loadSubscribersFrom = (patterns: readonly string[]): Promise<number> => importAll(patterns);

/** And for seeds, which `packages/db` collects the same way. */
export const loadSeedsFrom = (patterns: readonly string[]): Promise<number> => importAll(patterns);
