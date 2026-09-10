import { fileURLToPath } from 'node:url';

/** Scripts run with `packages/db` as the working directory; every path is resolved from this file. */
export const repoRoot = (): string => fileURLToPath(new URL('../../../', import.meta.url));

export const packageRoot = (): string => fileURLToPath(new URL('../', import.meta.url));

export const migrationsFolder = (): string => fileURLToPath(new URL('../drizzle', import.meta.url));

export const composedSchemaFile = (): string => fileURLToPath(new URL('./schema.ts', import.meta.url));
