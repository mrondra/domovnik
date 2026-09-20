import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Scripts run with `apps/web` as the working directory; every path is resolved from this file. */
export const repoRoot = (): string => fileURLToPath(new URL('../../../../', import.meta.url));

const NAVIGATION_FILE = 'apps/web/src/navigation/navigation.generated.ts';

/** Takes a root so `pnpm gen:feature` can compose the barrel of the repository it is writing into. */
export const navigationFile = (root: string = repoRoot()): string => join(root, NAVIGATION_FILE);

const EVIDENCE_FILE = 'apps/web/src/approvals/evidence.generated.ts';

export const evidenceFile = (root: string = repoRoot()): string => join(root, EVIDENCE_FILE);
