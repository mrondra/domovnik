import type { RequestContext } from '../context/index';
import type { TenantId } from '../ids/index';

/** What the composition layer hands to every seed: the tenant being seeded and a context on it. */
export interface SeedContext {
  readonly tenantId: TenantId;
  readonly ctx: RequestContext;
}

/**
 * A feature declares one of these in `seed/<name>.seed.ts`. `dependsOn` carries feature names, so a
 * seed that needs SVJ units in place says so instead of relying on the order of a directory listing.
 */
export interface SeedModule {
  readonly name: string;
  readonly dependsOn?: readonly string[] | undefined;
  run(context: SeedContext): Promise<void>;
}
