import { fileURLToPath } from 'node:url';

/** Scripts run with `apps/api` as the working directory; every path is resolved from this file. */
export const repoRoot = (): string => fileURLToPath(new URL('../../../../', import.meta.url));

export const modulesFile = (): string => fileURLToPath(new URL('./modules.generated.ts', import.meta.url));
