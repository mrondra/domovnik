import { fileURLToPath } from 'node:url';

export const repoRoot = (): string => fileURLToPath(new URL('../../../', import.meta.url));

export const featurePath = (name: string): string => `packages/features/${name}`;
